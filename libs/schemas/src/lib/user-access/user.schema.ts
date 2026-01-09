import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';
import { ObjectId } from 'mongodb'
// import { Schema as MongooseSchema } from 'mongoose';
import { ROLE } from '@common/constant/enum/action.constant';
import { StatusAccount } from '@common/constant/enum/status-account.constant';
import { LEVEL_USER } from '@common/constant/enum/level-user.constant';
import { SEX_USER } from '@common/constant/enum/sex-user.constant';


@Schema({ _id: false })
export class ExpertInfo {
    @Prop({ type: String })
    teachAt?: string;

    @Prop({ type: String })
    information?: string;

    @Prop({ type: String })
    major?: string;

    @Prop({ type: String, enum: LEVEL_USER })
    level?: LEVEL_USER;

    @Prop({ type: Number })
    price: number;
}

@Schema({ _id: false })
export class MemberInfo {
    @Prop({ type: String, required: true })
    highSchool: string;
}

@Schema({ collection: 'user' })
export class User extends Base {
    @Prop({ type: String, unique: true })
    username?: string

    @Prop({ type: String })
    name?: string

    @Prop({ type: String, unique: true })
    email?: string

    @Prop({ type: String })
    fileAvartarUrl?: string

    @Prop({ type: ObjectId, ref: 'Ward' })
    wardId?: ObjectId

    @Prop({ type: ExpertInfo, required: false })
    expertProfile?: ExpertInfo;

    @Prop({ type: MemberInfo, required: false })
    memberProfile?: MemberInfo;

    @Prop({ type: String })
    userId?: string

    @Prop({ type: String, enum: StatusAccount, default: StatusAccount.ACTIVE })
    statusAccount?: StatusAccount

    @Prop({ type: String, enum: ROLE })
    roleName?: ROLE;

    @Prop({ type: String, enum: SEX_USER })
    sex: SEX_USER;


}



export const UserSchema = createSchema(User)

export const UserModelName = User.name

export const UserDestination = {
    name: UserModelName,
    schema: UserSchema
}

export type UserModel = Model<User>;

