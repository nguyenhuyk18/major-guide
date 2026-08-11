import {
    Body,
    Controller,
    DefaultValuePipe,
    Get,
    Inject,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { firstValueFrom, map } from 'rxjs';
import { TCP_SERVICE } from '@common/configuration/tcp.config';
import { ROLE } from '@common/constant/enum/action.constant';
import { TCP_CHAT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { UserInfo } from '@common/decorators/get-user.decorator';
import { ProcessId } from '@common/decorators/processid.decorator';
import { Roles } from '@common/decorators/role.decorator';
import { SendPrivateMessageRequestDto } from '@common/interfaces/gateway/chat';
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import {
    GetPrivateMessagesTcpRequest,
    MarkPrivateRoomReadTcpRequest,
    MarkPrivateRoomReadTcpResponse,
    PrivateMessagesPageTcpResponse,
    SendPrivateMessageTcpRequest
} from '@common/interfaces/tcp/chat';
import { ChatPrivate } from '@common/schemas/chat/chat-private.schema';
import { User } from '@common/schemas/user-access/user.schema';

@ApiTags('Private Chat')
@Controller('chat-private')
export class ChatPrivateController {
    constructor(@Inject(TCP_SERVICE.CHAT_SERVICE) private readonly chatService: TcpClient) { }

    @Post()
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER, ROLE.EXPERT])
    @ApiOperation({ summary: 'Gửi tin nhắn text vào room' })
    async send(@Body() body: SendPrivateMessageRequestDto, @UserInfo() user: User, @ProcessId() processId: string) {
        const data = await firstValueFrom(this.chatService.send<ChatPrivate, SendPrivateMessageTcpRequest>(
            TCP_CHAT_SERVICE_MESSAGE.SEND_PRIVATE_MESSAGE,
            { processId, data: { roomId: body.roomId, content: body.content, requesterId: user.id, requesterRole: user.roleName as ROLE.MEMBER | ROLE.EXPERT } }
        ).pipe(map(response => response.data)));
        return new ResponseDto<ChatPrivate>({ data });
    }

    @Get('rooms/:roomId')
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER, ROLE.EXPERT])
    @ApiOperation({ summary: 'Lấy lịch sử tin nhắn trong room, mới nhất trước' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 20 })
    async getMessages(
        @Param('roomId') roomId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @UserInfo() user: User,
        @ProcessId() processId: string
    ) {
        const data = await firstValueFrom(this.chatService.send<PrivateMessagesPageTcpResponse, GetPrivateMessagesTcpRequest>(
            TCP_CHAT_SERVICE_MESSAGE.GET_PRIVATE_MESSAGES,
            { processId, data: { roomId, page, limit, requesterId: user.id } }
        ).pipe(map(response => response.data)));
        return new ResponseDto<PrivateMessagesPageTcpResponse>({ data });
    }

    @Patch('rooms/:roomId/read')
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER, ROLE.EXPERT])
    @ApiOperation({ summary: 'Đánh dấu các tin hiện tại trong room là đã đọc' })
    async markRead(@Param('roomId') roomId: string, @UserInfo() user: User, @ProcessId() processId: string) {
        const data = await firstValueFrom(this.chatService.send<MarkPrivateRoomReadTcpResponse, MarkPrivateRoomReadTcpRequest>(
            TCP_CHAT_SERVICE_MESSAGE.MARK_PRIVATE_ROOM_READ,
            { processId, data: { roomId, requesterId: user.id } }
        ).pipe(map(response => response.data)));
        return new ResponseDto<MarkPrivateRoomReadTcpResponse>({ data });
    }
}
