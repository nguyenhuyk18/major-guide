import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Room, RoomModel, RoomModelName } from '@common/schemas/chat/room.schema';

@Injectable()
export class RoomRepository {
    constructor(
        @InjectModel(RoomModelName)
        private readonly roomModel: RoomModel
    ) { }

    create(data: Partial<Room>) {
        return this.roomModel.create(data);
    }

    findByParticipants(memberId: string, expertId: string) {
        return this.roomModel.findOne({
            id_member: memberId,
            id_expert: expertId
        }).lean().exec();
    }

    findByParticipant(participantId: string, role: 'member' | 'expert') {
        const condition = role === 'member'
            ? { id_member: participantId }
            : { id_expert: participantId };

        return this.roomModel.find(condition)
            .sort({ updatedAt: -1 })
            .lean()
            .exec();
    }

    setMessageActivity(room: Room, senderId: string, lastMessage: Room['last_message']) {
        const unreadField = senderId === room.id_member ? 'unread_expert' : 'unread_member';
        return this.roomModel.findByIdAndUpdate(
            room._id,
            { $set: { last_message: lastMessage }, $inc: { [unreadField]: 1 } },
            { new: true }
        ).lean().exec();
    }

    markRead(room: Room, readerId: string, readAt: Date) {
        const isMember = readerId === room.id_member;
        return this.roomModel.findByIdAndUpdate(
            room._id,
            {
                $set: isMember
                    ? { member_last_read_at: readAt, unread_member: 0 }
                    : { expert_last_read_at: readAt, unread_expert: 0 }
            },
            { new: true }
        ).lean().exec();
    }

    findById(roomId: string) {
        return this.roomModel.findById(roomId).lean().exec();
    }

}
