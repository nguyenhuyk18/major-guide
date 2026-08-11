import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { ROLE } from '@common/constant/enum/action.constant';
import {
    CreateRoomTcpRequest,
    FindRoomsTcpRequest,
    RoomListItemTcpResponse
} from '@common/interfaces/tcp/chat';
import { Room } from '@common/schemas/chat/room.schema';
import { RoomRepository } from '../repositories/room.repository';
import { TCP_SERVICE } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { firstValueFrom, map } from 'rxjs';
import { User } from '@common/schemas/user-access/user.schema';
import { StatusAccount } from '@common/constant/enum/status-account.constant';

@Injectable()
export class RoomService {
    constructor(
        private readonly roomRepository: RoomRepository,
        @Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly userAccessClient: TcpClient
    ) { }

    async create(data: CreateRoomTcpRequest, processId: string): Promise<Room> {
        if (!ObjectId.isValid(data.memberId) || !ObjectId.isValid(data.expertId)) {
            throw new BadRequestException('ID thành viên hoặc chuyên gia không hợp lệ');
        }
        if (data.memberId === data.expertId) {
            throw new BadRequestException('Không thể tạo room với chính mình');
        }

        const expert = await firstValueFrom(
            this.userAccessClient.send<User, { id_user: string; isKeycloak: boolean }>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.GET_USER_BY_ID,
                { processId, data: { id_user: data.expertId, isKeycloak: false } }
            ).pipe(map(response => response.data))
        );
        if (!expert || expert.roleName !== ROLE.EXPERT || expert.statusAccount !== StatusAccount.ACTIVE) {
            throw new BadRequestException('Chuyên gia không tồn tại hoặc không hoạt động');
        }

        const existingRoom = await this.roomRepository.findByParticipants(
            data.memberId,
            data.expertId
        );
        if (existingRoom) return existingRoom as Room;

        const nameRoom = data.nameRoom?.trim() || 'Cuộc trò chuyện tư vấn';
        try {
            return await this.roomRepository.create({
                name_room: nameRoom,
                id_member: data.memberId,
                id_expert: data.expertId
            });
        } catch (error) {
            if (error?.code === 11000) {
                return this.roomRepository.findByParticipants(
                    data.memberId,
                    data.expertId
                ) as Promise<Room>;
            }
            throw error;
        }
    }

    async findByParticipant(data: FindRoomsTcpRequest): Promise<RoomListItemTcpResponse[]> {
        if (!ObjectId.isValid(data.participantId)) {
            throw new BadRequestException('ID người dùng không hợp lệ');
        }
        const rooms = await this.roomRepository.findByParticipant(
            data.participantId,
            data.participantRole
        );
        return rooms.map(room => {
            const unreadCount = data.participantRole === ROLE.MEMBER
                ? room.unread_member || 0
                : room.unread_expert || 0;
            const { unread_member, unread_expert, ...safeRoom } = room as Room & Record<string, any>;
            return { ...safeRoom, unreadCount } as RoomListItemTcpResponse;
        });
    }

    async getParticipantRoom(roomId: string, requesterId: string): Promise<Room> {
        if (!ObjectId.isValid(roomId)) throw new NotFoundException('Không tìm thấy room');
        const room = await this.roomRepository.findById(roomId);
        if (!room) throw new NotFoundException('Không tìm thấy room');
        if (room.id_member !== requesterId && room.id_expert !== requesterId) {
            throw new ForbiddenException('Bạn không thuộc room này');
        }
        return room as Room;
    }
}
