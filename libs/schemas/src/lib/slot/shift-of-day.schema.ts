import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';
import { DAY_IN_WEEK } from '@common/constant/enum/day-in-week.constant';
import { ObjectId } from 'mongodb'

@Schema({ collection: 'shift-in-day' })
export class ShiftInWeek extends Base {
    @Prop({ type: String, enum: DAY_IN_WEEK })
    day: DAY_IN_WEEK

    @Prop({ type: ObjectId, ref: 'Shift' })
    shift_id: ObjectId
}

export const ShiftInWeekSchema = createSchema(ShiftInWeek)

export const ShiftInWeekModelName = ShiftInWeek.name

export const ShiftInWeekDestination = {
    name: ShiftInWeekModelName,
    schema: ShiftInWeekSchema
}

export type ShiftInWeekModel = Model<ShiftInWeek>;

