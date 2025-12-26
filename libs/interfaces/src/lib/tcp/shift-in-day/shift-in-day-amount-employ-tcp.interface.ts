import { DAY_IN_WEEK } from "@common/constant/enum/day-in-week.constant";
// import { Shift } from "@common/schemas/slot/shift.schema";
import { ObjectId } from 'mongodb';

export class ShiftInDayAmount {

    day: DAY_IN_WEEK


    shiftInfo: ObjectId


    amount: number

    id: string
}