import { BadRequestException, Injectable } from '@nestjs/common';
import {
    GetPrivateMessagesTcpRequest,
    MarkPrivateRoomReadTcpRequest,
    PrivateMessagesPageTcpResponse,
    SendPrivateMessageTcpRequest
} from '@common/interfaces/tcp/chat';
import { ChatPrivate } from '@common/schemas/chat/chat-private.schema';
import { ChatPrivateRepository } from '../repositories/chat-private.repository';
import { RoomService } from '../../room/services/room.service';
import { RoomRepository } from '../../room/repositories/room.repository';
import { PrivateChatGateway } from '../../socket/services/private-socket.gateway';

@Injectable()
export class ChatPrivateService {
    constructor(
        private readonly chatPrivateRepository: ChatPrivateRepository,
        private readonly roomService: RoomService,
        private readonly roomRepository: RoomRepository,
        private readonly privateChatGateway: PrivateChatGateway
    ) { }

    async send(data: SendPrivateMessageTcpRequest): Promise<ChatPrivate> {
        const content = data.content?.trim();
        if (!content) throw new BadRequestException('Nội dung tin nhắn không được để trống');
        if (content.length > 2000) throw new BadRequestException('Tin nhắn không được vượt quá 2000 ký tự');

        const room = await this.roomService.getParticipantRoom(data.roomId, data.requesterId);
        const message = await this.chatPrivateRepository.create({
            content,
            sendBy: data.requesterId,
            id_room: room._id
        });
        const plainMessage = message.toObject({ virtuals: true }) as ChatPrivate;
        await this.roomRepository.setMessageActivity(room, data.requesterId, {
            id: plainMessage.id,
            content: plainMessage.content,
            sendBy: plainMessage.sendBy,
            createdAt: plainMessage.createdAt
        });
        this.privateChatGateway.emitNewMessage(room, plainMessage);
        return plainMessage;
    }

    async getMessages(data: GetPrivateMessagesTcpRequest): Promise<PrivateMessagesPageTcpResponse> {
        await this.roomService.getParticipantRoom(data.roomId, data.requesterId);
        const page = Math.max(1, Number(data.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(data.limit) || 20));
        const { result, total } = await this.chatPrivateRepository.findByRoom(data.roomId, page, limit);
        return { result: result as ChatPrivate[], page, limit, total, totalPage: Math.ceil(total / limit) };
    }

    async markRead(data: MarkPrivateRoomReadTcpRequest) {
        const room = await this.roomService.getParticipantRoom(data.roomId, data.requesterId);
        const readAt = new Date();
        await this.roomRepository.markRead(room, data.requesterId, readAt);
        const result = { roomId: data.roomId, readerId: data.requesterId, readAt };
        this.privateChatGateway.emitRoomRead(room, result);
        return result;
    }
}
