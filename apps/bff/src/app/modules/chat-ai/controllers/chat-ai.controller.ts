import axios from 'axios';
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import {
  ChatAiRequestDto,
  ChatAiResponseDto,
  ChatAiRagRequestDto,
  ChatAiRagResponseDto,
} from '../dto';
import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Req,
  Param,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { randomUUID } from 'crypto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { Roles } from '@common/decorators/role.decorator';
import { UserInfo } from '@common/decorators/get-user.decorator';
import { ROLE } from '@common/constant/enum/action.constant';
import { User } from '@common/schemas/user-access/user.schema';
import { RABBIT_SERVICE } from '@common/configuration/rabbit.config';
import { MAIL_SERVICE_RABBIT_MESSAGE } from '@common/constant/enum/rabbitmq-message.constant';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';

const AGENTIC_AI_BASE_URL =
  process.env['AGENTIC_AI_SERVICE_URL'] || 'http://localhost:8000';

@ApiTags('Chat AI')
@Controller('chat-ai')
export class ChatAiController {
  private readonly requestWindows = new Map<string, number[]>();
  private readonly ragRequestWindows = new Map<string, number[]>();
  private readonly pendingActions = new Map<
    string,
    { adminId: string; action: any; expiresAt: number; used: boolean }
  >();

  constructor(
    @Inject(RABBIT_SERVICE.MAIL_SERVICE) private readonly mailClient: TcpClient
  ) {}

  private enforceRateLimit(adminId: string) {
    const now = Date.now();
    const recent = (this.requestWindows.get(adminId) || []).filter(
      (time) => now - time < 60_000
    );
    if (recent.length >= 10) {
      throw new HttpException(
        'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau một phút.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    recent.push(now);
    this.requestWindows.set(adminId, recent);
  }

  private registerActions(adminId: string, actions: any[] = []) {
    return actions
      .slice(0, 3)
      .map((action) => {
        if (
          action?.type !== 'email_draft' ||
          action?.requires_confirmation !== true
        )
          return null;
        const id = randomUUID();
        this.pendingActions.set(id, {
          adminId,
          action,
          expiresAt: Date.now() + 5 * 60_000,
          used: false,
        });
        return {
          ...action,
          id,
          expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        };
      })
      .filter(Boolean);
  }

  private enforceRagRateLimit(userId: string) {
    const now = Date.now();
    const recent = (this.ragRequestWindows.get(userId) || []).filter(
      (time) => now - time < 60_000
    );
    if (recent.length >= 8)
      throw new HttpException(
        'Bạn gửi câu hỏi quá nhanh. Vui lòng chờ một phút.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    recent.push(now);
    this.ragRequestWindows.set(userId, recent);
  }

  @Post()
  @ApiOkResponse({ type: ResponseDto<ChatAiResponseDto> })
  @Authorization({ secured: true })
  @Roles([ROLE.ADMIN])
  @ApiOperation({
    summary: 'Gửi tin nhắn tới AI Agent và nhận phản hồi (LLM + Tools)',
  })
  async sendMessage(
    @Body() data: ChatAiRequestDto,
    @UserInfo() user: User,
    @Req() request: Request
  ): Promise<ResponseDto<ChatAiResponseDto>> {
    this.enforceRateLimit(user.id);
    try {
      const response = await axios.post<ChatAiResponseDto>(
        `${AGENTIC_AI_BASE_URL}/chat-ai`,
        { message: data.message, admin_id: user.id },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: request.headers.authorization || '',
            'X-Internal-Token': process.env['AGENTIC_INTERNAL_TOKEN']?.trim() || '',
          },
          timeout: 90000,
        }
      );
      const safeResponse = {
        ...response.data,
        actions: this.registerActions(user.id, response.data?.actions || []),
      };
      return new ResponseDto<ChatAiResponseDto>({ data: safeResponse });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi gọi AI Agent service';
      throw new HttpException(message, HttpStatus.BAD_GATEWAY);
    }
  }

  @Post('actions/:id/confirm')
  @Authorization({ secured: true })
  @Roles([ROLE.ADMIN])
  @ApiOperation({ summary: 'Xác nhận một lần hành động do Admin AI đề xuất' })
  async confirmAction(@Param('id') id: string, @UserInfo() user: User) {
    const pending = this.pendingActions.get(id);
    if (!pending || pending.adminId !== user.id)
      throw new NotFoundException(
        'Hành động không tồn tại hoặc không thuộc tài khoản này'
      );
    if (pending.used)
      throw new BadRequestException('Hành động này đã được thực hiện');
    if (pending.expiresAt < Date.now()) {
      this.pendingActions.delete(id);
      throw new BadRequestException('Yêu cầu xác nhận đã hết hạn');
    }
    if (pending.action.type !== 'email_draft')
      throw new BadRequestException('Loại hành động không được hỗ trợ');

    pending.used = true;
    this.mailClient
      .emit(MAIL_SERVICE_RABBIT_MESSAGE.SEND_ADMIN_EMAIL, {
        processId: `admin-ai:${id}`,
        data: {
          to: pending.action.recipient,
          subject: pending.action.subject,
          content: pending.action.content,
          requestedBy: user.id,
          actionId: id,
        },
      })
      .subscribe({
        error: (error) =>
          console.error(`Failed to queue AI email ${id}:`, error),
      });
    return new ResponseDto({
      data: {
        actionId: id,
        status: 'queued',
        message: 'Email đã được đưa vào hàng đợi gửi.',
      },
    });
  }

  @Post('rag')
  @ApiOkResponse({ type: ResponseDto<ChatAiRagResponseDto> })
  @Authorization({ secured: true })
  @Roles([ROLE.MEMBER])
  @ApiOperation({
    summary: 'Gửi tin nhắn tới AI Agent với RAG (Embedding → Qdrant → LLM)',
  })
  async chatWithRag(
    @Body() data: ChatAiRagRequestDto,
    @UserInfo() user: User
  ): Promise<ResponseDto<ChatAiRagResponseDto>> {
    this.enforceRagRateLimit(user.id);
    try {
      const internalToken = process.env['AGENTIC_INTERNAL_TOKEN']?.trim();
      if (!internalToken)
        throw new HttpException(
          'RAG internal authentication is not configured',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      const response = await axios.post<ChatAiRagResponseDto>(
        `${AGENTIC_AI_BASE_URL}/chat-ai/rag`,
        { message: data.message, history: (data.history || []).slice(-8) },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': internalToken,
          },
          timeout: 90000,
        }
      );
      return new ResponseDto<ChatAiRagResponseDto>({ data: response.data });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi gọi AI Agent RAG service';
      throw new HttpException(message, HttpStatus.BAD_GATEWAY);
    }
  }
}
