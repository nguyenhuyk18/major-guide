import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
    ChatPrivate,
    ChatPrivateModel,
    ChatPrivateModelName
} from '@common/schemas/chat/chat-private.schema';
import { ObjectId } from 'mongodb';

@Injectable()
export class ChatPrivateRepository {
    constructor(
        @InjectModel(ChatPrivateModelName)
        private readonly chatPrivateModel: ChatPrivateModel
    ) { }

    create(data: Partial<ChatPrivate>) {
        return this.chatPrivateModel.create(data);
    }

    async findByRoom(roomId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const roomObjectId = new ObjectId(roomId);
        const [result, total] = await Promise.all([
            this.chatPrivateModel.find({ id_room: roomObjectId })
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean({ virtuals: true })
                .exec(),
            this.chatPrivateModel.countDocuments({ id_room: roomObjectId }).exec()
        ]);
        return { result, total };
    }
}
