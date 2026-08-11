import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';
import { ObjectId } from 'mongodb';


@Schema({ collection: 'chat-private' })
export class ChatPrivate extends Base {
    @Prop({ type: String, required: true, trim: true, maxlength: 2000 })
    content: string;

    // id user
    @Prop({ type: String, required: true, index: true })
    sendBy: string;


    @Prop({ type: ObjectId, ref: 'Room', required: true, index: true })
    id_room: ObjectId

}



export const ChatPrivateSchema = createSchema(ChatPrivate)
ChatPrivateSchema.index({ id_room: 1, createdAt: -1, _id: -1 })

export const ChatPrivateModelName = ChatPrivate.name

export const ChatPrivateDestination = {
    name: ChatPrivateModelName,
    schema: ChatPrivateSchema
}

export type ChatPrivateModel = Model<ChatPrivate>;

