import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { ResponseDto } from "@common/interfaces/gateway/response-gateway.dto";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Controller, Get, Inject, Post, Query, Body, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { firstValueFrom, map, pipe } from "rxjs";
import { ChatComunityRequestDto, ChatComunityResponseGateway } from '@common/interfaces/gateway/chat';
import { TCP_CHAT_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
import { ChatCommunityTcpResponeList, ChatComunityResponseTcp, ChatComunityTcpRequest } from '@common/interfaces/tcp/chat';
import { UserInfo } from "@common/decorators/get-user.decorator";
import { User } from "@common/schemas/user-access/user.schema";
import { Authorization } from "@common/decorators/authorizer.decorator";

@Controller('chat-community')
@ApiTags('Chat Community')
export class ChatComunityController {
    constructor(@Inject(TCP_SERVICE.CHAT_SERVICE) private readonly chatService: TcpClient) { }

    @Post()
    @ApiOkResponse({ type: ResponseDto<ChatComunityResponseGateway> })
    @Authorization({ secured: true })
    @ApiOperation({ summary: 'Thêm Tin Nhắn Mới !!!' })
    async saveMessage(@Body() data: ChatComunityRequestDto, @ProcessId() processId, @UserInfo() userInfo: Partial<User>) {

        const rs = await firstValueFrom(this.chatService.send<ChatComunityResponseTcp, ChatComunityTcpRequest>(TCP_CHAT_SERVICE_MESSAGE.SAVE_MESSAGE_COMMUNITY, {
            data: {
                content: data.content,
                sendBy: userInfo.id,
                replyTo: data.replyTo
            }, processId
        }).pipe(map(row => row.data)));

        return new ResponseDto<ChatComunityResponseGateway>({ data: rs });
    }


    @Get()
    @ApiOkResponse({ type: ResponseDto<ChatCommunityTcpResponeList> })
    @ApiQuery({ name: 'page', type: Number })
    @ApiOperation({ summary: 'Xem các tin nhắn (có phân trang)' })
    async getAllMessage(@ProcessId() processId, @Query('page') page?: number) {

        const newPage = page ? page : 1;

        const rs = await firstValueFrom(this.chatService.send<ChatCommunityTcpResponeList, { page: number }>(TCP_CHAT_SERVICE_MESSAGE.GET_ALL_MESSAGE_COMMUNITY, { data: { page: newPage }, processId }).pipe(map(row => row.data)));

        return new ResponseDto<ChatCommunityTcpResponeList>({ data: rs });
    }

    @Get(':id')
    @ApiOkResponse({ type: ResponseDto<ChatComunityResponseGateway> })
    // @ApiQuery({ name: 'page', type: Number })
    @ApiOperation({ summary: 'Tìm tin nhắn theo mã tin nhắn !!!' })
    async getMessageById(@Param('id') id: string, @ProcessId() processId: string) {
        const rs = await firstValueFrom(this.chatService.send<ChatComunityResponseTcp, { id: string }>(TCP_CHAT_SERVICE_MESSAGE.GET_MESSAGE_COMMUNITY_BY_ID, { processId, data: { id: id } }).pipe(map(row => row.data)));

        return new ResponseDto<ChatComunityResponseGateway>({ data: rs });
    }
}
