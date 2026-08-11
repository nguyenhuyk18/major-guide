import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';



@Schema({ collection: 'room-chat' })
export class Room extends Base {
    @Prop({ type: String, required: true, maxlength: 100 })
    name_room: string;

    @Prop({ type: String, required: true, index: true })
    id_member: string;

    @Prop({ type: String, required: true, index: true })
    id_expert: string;

    @Prop({ type: Date, default: null })
    member_last_read_at?: Date;

    @Prop({ type: Date, default: null })
    expert_last_read_at?: Date;

    @Prop({ type: Number, default: 0, min: 0 })
    unread_member: number;

    @Prop({ type: Number, default: 0, min: 0 })
    unread_expert: number;

    @Prop({ type: Object, default: null })
    last_message?: {
        id: string;
        content: string;
        sendBy: string;
        createdAt: Date;
    };

}



export const RoomSchema = createSchema(Room)
RoomSchema.index({ id_member: 1, id_expert: 1 }, { unique: true })
RoomSchema.index({ id_member: 1, updatedAt: -1 })
RoomSchema.index({ id_expert: 1, updatedAt: -1 })

export const RoomModelName = Room.name

export const RoomDestination = {
    name: RoomModelName,
    schema: RoomSchema
}

export type RoomModel = Model<Room>;

