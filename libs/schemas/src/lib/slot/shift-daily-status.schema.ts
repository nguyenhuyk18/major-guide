import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';
import { ObjectId } from 'mongodb';
import { STATUS_SLOT } from '@common/constant/enum/status_slot.contant';

@Schema({ collection: 'shift-daily-status' })
export class ShiftDailyStatus extends Base {


    @Prop({ type: ObjectId, ref: 'ShiftInWeek' })
    id_shift_in_day: ObjectId;

    @Prop({ type: String })
    id_expert: string;

    @Prop({ type: String })
    booking_id: string;

    @Prop({ type: Date })
    date_reverse: Date;

    @Prop({ type: String, enum: STATUS_SLOT })
    status: STATUS_SLOT;

    @Prop({ type: String })
    id_reverse: string;
}

export const ShiftDailyStatusSchema = createSchema(ShiftDailyStatus)

export const ShiftDailyStatusModelName = ShiftDailyStatus.name

export const ShiftDailyStatusDestination = {
    name: ShiftDailyStatusModelName,
    schema: ShiftDailyStatusSchema
}

export type ShiftDailyStatusModel = Model<ShiftDailyStatus>;

