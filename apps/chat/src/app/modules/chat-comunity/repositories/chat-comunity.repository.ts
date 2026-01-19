import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ChatComunityModel, ChatComunityModelName } from '@common/schemas/chat/chat-comunity.schema';
import { ChatComunity } from '@common/schemas/chat/chat-comunity.schema';
// import { Filter } from "mongodb";
// import { Filter } from "mongodb";


@Injectable()
export class ChatComunityRepository {
    constructor(@InjectModel(ChatComunityModelName) private readonly chatCommunityModel: ChatComunityModel) { }

    saveMessage(data: Partial<ChatComunity>) {
        const rs = this.chatCommunityModel.create(data);
        return rs;
    }

    // updateMessage(data : )

    fetchAll(skip: number = null, limit: number = null) {
        const rs = this.chatCommunityModel.find();

        // if (sortigation) {
        // 1 tăng dần
        // -1 giảm dân
        rs.sort({ _id: -1 });
        // console.log(skip, ' ', limit);
        if (skip != null && limit) {
            rs.skip(skip).limit(limit)
        }

        return rs.lean().exec();
    }

    getAll(limit = 20, index = 0) {
        const skip = limit * index;

        const rs = this.fetchAll(skip, limit);
        return rs;
    }

    async getById(id: string) {
        const rs = await this.chatCommunityModel.findById(id);
        return rs;
    }

    async getAllNumBer() {
        const rs = await this.chatCommunityModel.find();
        return rs.length;
    }

}