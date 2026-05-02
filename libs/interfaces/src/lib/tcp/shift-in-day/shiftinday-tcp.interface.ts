// import { Shift } from "@common/schemas/slot/shift.schema"
import { ObjectId } from "mongodb";

export class ShiftInWeekInterface {
    // @Prop({ type: String, enum: DAY_IN_WEEK })
    day: string

    // @Prop({ type: ObjectId, ref: 'Shift' })
    shift_id: ObjectId


}