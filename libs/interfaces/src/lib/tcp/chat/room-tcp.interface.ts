import { ROLE } from '@common/constant/enum/action.constant';
import { Room } from '@common/schemas/chat/room.schema';

export interface CreateRoomTcpRequest {
    memberId: string;
    expertId: string;
    nameRoom?: string;
}

export interface FindRoomsTcpRequest {
    participantId: string;
    participantRole: ROLE.MEMBER | ROLE.EXPERT;
}

export type RoomListItemTcpResponse = Room & { unreadCount: number };
