import { Injectable } from "@nestjs/common";
import { ChatComunityRepository } from "../repositories/chat-comunity.repository";
import { ChatCommunityTcpResponeList, ChatComunityTcpRequest } from "@common/interfaces/tcp/chat";
import { ChatSocketGateway } from "../../socket/services/socket.service";
import { RADIO_CHAT } from "@common/constant/enum/radio-chatting.contant";


@Injectable()
export class ChatComunityService {
    constructor(private readonly chatComunityService: ChatComunityRepository,
        private readonly chatSocketGateway: ChatSocketGateway
    ) { }

    async getAll(page: number) {
        const index = page - 1;
        const rs = await this.chatComunityService.getAll(20, index);


        const numberOfMessage = await this.chatComunityService.getAllNumBer();
        const totalPage = Math.ceil(numberOfMessage / 20);
        console.log(totalPage);
        let hasMore = true;

        if (page >= totalPage) {
            hasMore = false;
        }



        return {
            chatList: rs,
            hasMore
        } as ChatCommunityTcpResponeList;
    }


    async saveMess(data: Partial<ChatComunityTcpRequest>) {
        const rs = await this.chatComunityService.saveMessage(data);
        this.chatSocketGateway.sendMessageToRoom(RADIO_CHAT.SEND_MESSAGE_COMMUNITY, { id: rs.id, message: data.content, replyTo: data.replyTo, userId: data.sendBy });
        return rs;
    }


    getById(id: string) {
        const rs = this.chatComunityService.getById(id);
        return rs;
    }



}