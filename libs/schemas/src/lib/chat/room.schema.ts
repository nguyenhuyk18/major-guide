import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';



@Schema({ collection: 'room-chat' })
export class Room extends Base {
    @Prop({ type: String })
    name_room: string;

}



export const RoomSchema = createSchema(Room)

export const RoomModelName = Room.name

export const RoomDestination = {
    name: RoomModelName,
    schema: RoomSchema
}

export type RoomModel = Model<Room>;

