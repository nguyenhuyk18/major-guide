import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';
import { ObjectId } from 'mongodb'
import { STATUS_REGISTER_ADVISE } from '@common/constant/enum/status-register-advise.constant';


// export class ShiftInCharge {
//     @Prop({ type: String, enum: DAY_IN_WEEK })
//     day: DAY_IN_WEEK

//     @Prop({ type: ObjectId, ref: 'Shift' })
//     shift_id: ObjectId
// }

@Schema({ collection: 'register' })
export class Register extends Base {
    @Prop({ type: String, unique: true })
    id_expert: string

    @Prop({ type: [ObjectId], ref: 'ShiftInWeek' })
    day: ObjectId[]


    @Prop({ type: String, enum: STATUS_REGISTER_ADVISE, default: STATUS_REGISTER_ADVISE.UNREVIEWED })
    status: STATUS_REGISTER_ADVISE
}



export const RegisterSchema = createSchema(Register)

export const RegisterModelName = Register.name

export const RegisterDestination = {
    name: RegisterModelName,
    schema: RegisterSchema
}

export type RegisterModel = Model<Register>;

