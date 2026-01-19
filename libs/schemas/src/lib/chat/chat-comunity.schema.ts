import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';



@Schema({ collection: 'chat-comunity' })
export class ChatComunity extends Base {
    @Prop({ type: String })
    content: string;

    // id user
    @Prop({ type: String })
    sendBy: string;

    @Prop({ type: String })
    replyTo?: string;

}



export const ChatComunitySchema = createSchema(ChatComunity)

export const ChatComunityModelName = ChatComunity.name

export const ChatComunityDestination = {
    name: ChatComunityModelName,
    schema: ChatComunitySchema
}

export type ChatComunityModel = Model<ChatComunity>;

