import { Controller, UseInterceptors } from "@nestjs/common";
import { ChatComunityService } from "../services/chat-comunity.service";
import { RequestParams } from '@common/decorators/request-params.decorator';
// import { ChatComunityTcpRequest } from '@common/interfaces/tcp/chat';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { ChatCommunityTcpResponeList, ChatComunityResponseTcp, ChatComunityTcpRequest } from '@common/interfaces/tcp/chat';
import { MessagePattern } from "@nestjs/microservices";
import { TCP_CHAT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptors';


@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class ChatComunityController {
    constructor(private readonly chatComunityService: ChatComunityService) { }

    @MessagePattern(TCP_CHAT_SERVICE_MESSAGE.SAVE_MESSAGE_COMMUNITY)
    async saveMessage(@RequestParams() param: ChatComunityTcpRequest) {
        const rs = await this.chatComunityService.saveMess(param);
        return ResponseTcp.success<ChatComunityResponseTcp>(rs);
    }

    @MessagePattern(TCP_CHAT_SERVICE_MESSAGE.GET_ALL_MESSAGE_COMMUNITY)
    async getAllMessage(@RequestParams() param: { page: number }) {
        const rs = await this.chatComunityService.getAll(param.page);

        // const numberOfMessage = await this


        return ResponseTcp.success<ChatCommunityTcpResponeList>(rs)
    }

    @MessagePattern(TCP_CHAT_SERVICE_MESSAGE.GET_MESSAGE_COMMUNITY_BY_ID)
    async getMessageById(@RequestParams() param: { id: string }) {
        const rs = await this.chatComunityService.getById(param.id);
        return ResponseTcp.success<ChatComunityResponseTcp>(rs);
    }
}