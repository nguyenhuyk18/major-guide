import { ShiftInWeek } from '@common/schemas/slot/shift-of-day.schema';
import { RegisterTcpWithUserResponse } from '../register';
import { Register } from '@common/schemas/slot/register.schema';

export type ShiftInDayTcpResponse = ShiftInWeek

export class ShiftInDayTcpByIdResponse {
    register: RegisterTcpWithUserResponse[] | Register[];
    shiftInfo: ShiftInWeek;
}