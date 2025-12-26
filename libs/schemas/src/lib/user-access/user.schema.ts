import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';
import { ObjectId } from 'mongodb'
import { Schema as MongooseSchema } from 'mongoose';
import { ROLE } from '@common/constant/enum/action.constant';

@Schema({ collection: 'user' })
export class User extends Base {
    @Prop({ type: String, unique: true })
    username: string

    @Prop({ type: String })
    name: string

    @Prop({ type: String, unique: true })
    email: string

    @Prop({ type: String })
    fileAvartarUrl: string

    @Prop({ type: ObjectId, ref: 'Ward' })
    ward_id: ObjectId

    @Prop({ type: MongooseSchema.Types.Mixed })
    profile: string

    @Prop({ type: String })
    userId: string


    @Prop({ type: ObjectId, enum: ROLE })
    role_name: ROLE;
}



export const UserSchema = createSchema(User)

export const UserModelName = User.name

export const UserDestination = {
    name: UserModelName,
    schema: UserSchema
}

export type UserModel = Model<User>;

