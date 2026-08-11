import { ROLE } from '@common/constant/enum/action.constant';
import { ChatPrivate } from '@common/schemas/chat/chat-private.schema';

export interface SendPrivateMessageTcpRequest {
    roomId: string;
    content: string;
    requesterId: string;
    requesterRole: ROLE.MEMBER | ROLE.EXPERT;
}

export interface GetPrivateMessagesTcpRequest {
    roomId: string;
    page: number;
    limit: number;
    requesterId: string;
}

export interface MarkPrivateRoomReadTcpRequest {
    roomId: string;
    requesterId: string;
}

export interface PrivateMessagesPageTcpResponse {
    result: ChatPrivate[];
    page: number;
    limit: number;
    total: number;
    totalPage: number;
}

export interface MarkPrivateRoomReadTcpResponse {
    roomId: string;
    readerId: string;
    readAt: Date;
}
