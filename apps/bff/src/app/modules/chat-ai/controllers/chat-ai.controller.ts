import axios from 'axios';
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { ChatAiRequestDto, ChatAiResponseDto, ChatAiRagResponseDto } from '../dto';
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorization } from '@common/decorators/authorizer.decorator';

const AGENTIC_AI_BASE_URL = process.env['AGENTIC_AI_SERVICE_URL'] || 'http://localhost:8000';

@ApiTags('Chat AI')
@Controller('chat-ai')
export class ChatAiController {

    @Post()
    @ApiOkResponse({ type: ResponseDto<ChatAiResponseDto> })
    @Authorization({ secured: false })
    @ApiOperation({ summary: 'Gửi tin nhắn tới AI Agent và nhận phản hồi (LLM + Tools)' })
    async sendMessage(@Body() data: ChatAiRequestDto): Promise<ResponseDto<ChatAiResponseDto>> {
        try {
            const response = await axios.post<ChatAiResponseDto>(
                `${AGENTIC_AI_BASE_URL}/chat-ai`,
                { message: data.message },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );
            return new ResponseDto<ChatAiResponseDto>({ data: response.data });
        } catch (error) {
            const message = error.response?.data?.message
                || error.message
                || 'Lỗi khi gọi AI Agent service';
            throw new HttpException(message, HttpStatus.BAD_GATEWAY);
        }
    }

    @Post('rag')
    @ApiOkResponse({ type: ResponseDto<ChatAiRagResponseDto> })
    @Authorization({ secured: false })
    @ApiOperation({ summary: 'Gửi tin nhắn tới AI Agent với RAG (Embedding → Qdrant → LLM)' })
    async chatWithRag(@Body() data: ChatAiRequestDto): Promise<ResponseDto<ChatAiRagResponseDto>> {
        try {
            const response = await axios.post<ChatAiRagResponseDto>(
                `${AGENTIC_AI_BASE_URL}/chat-ai/rag`,
                { message: data.message },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );
            return new ResponseDto<ChatAiRagResponseDto>({ data: response.data });
        } catch (error) {
            const message = error.response?.data?.message
                || error.message
                || 'Lỗi khi gọi AI Agent RAG service';
            throw new HttpException(message, HttpStatus.BAD_GATEWAY);
        }
    }
}
