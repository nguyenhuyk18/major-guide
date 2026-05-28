import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';
import { STATUS_BOOKING } from '@common/constant/enum/status_slot.contant';
// import { ObjectId } from 'mongodb'
// import { STATUS_REGISTER_ADVISE } from '@common/constant/enum/status-register-advise.constant';


@Schema({ collection: 'reverse' })
export class Reverse extends Base {
    @Prop({ type: String })
    id_member: string;

    @Prop({ type: String })
    id_expert: string;

    @Prop({ type: String })
    id_shift_in_day: string;

    // ======================= //
    // Store as string YYYY-MM-DD to avoid timezone issues when only date matters
    @Prop({ type: String })
    day_support: string;

    @Prop({ type: Date })
    time_start: Date;

    @Prop({ type: Date })
    time_end: Date;

    // ======================= //
    @Prop({ type: String, enum: STATUS_BOOKING })
    status: STATUS_BOOKING


    @Prop({ type: Number })
    price_support: number;


    @Prop({ type: String })
    id_reverse: string;

    @Prop({ type: String })
    payment_link: string;

    @Prop({ type: Date })
    payment_date: Date;

    @Prop({ type: String })
    transaction_id: string;

    @Prop({ type: Date })
    payment_expires_at: Date;

    @Prop({ type: String })
    email_customer: string;

    @Prop({ type: String })
    name_customer: string;

    @Prop({ type: String })
    name_expert: string;

    @Prop({ type: String })
    avatar_expert: string;

    @Prop({ type: String })
    note: string;

    @Prop({ type: String })
    meet_link: string;

    @Prop({ type: Date, default: null })
    joinAt: Date;

    // @Prop({  })

}



export const ReverseSchema = createSchema(Reverse)

export const ReverseModelName = Reverse.name

export const ReverseDestination = {
    name: ReverseModelName,
    schema: ReverseSchema
}

export type ReverseModel = Model<Reverse>;

