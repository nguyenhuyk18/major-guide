import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TCP_CHAT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptors';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import {
    GetPrivateMessagesTcpRequest,
    MarkPrivateRoomReadTcpRequest,
    SendPrivateMessageTcpRequest
} from '@common/interfaces/tcp/chat';
import { ChatPrivateService } from '../services/chat-private.service';

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class ChatPrivateController {
    constructor(private readonly chatPrivateService: ChatPrivateService) { }

    @MessagePattern(TCP_CHAT_SERVICE_MESSAGE.SEND_PRIVATE_MESSAGE)
    async send(@RequestParams() data: SendPrivateMessageTcpRequest) {
        return ResponseTcp.success(await this.chatPrivateService.send(data));
    }

    @MessagePattern(TCP_CHAT_SERVICE_MESSAGE.GET_PRIVATE_MESSAGES)
    async getMessages(@RequestParams() data: GetPrivateMessagesTcpRequest) {
        return ResponseTcp.success(await this.chatPrivateService.getMessages(data));
    }

    @MessagePattern(TCP_CHAT_SERVICE_MESSAGE.MARK_PRIVATE_ROOM_READ)
    async markRead(@RequestParams() data: MarkPrivateRoomReadTcpRequest) {
        return ResponseTcp.success(await this.chatPrivateService.markRead(data));
    }
}
