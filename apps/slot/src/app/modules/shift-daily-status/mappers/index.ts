// import { ReverseTcpRequest } from "@common/interfaces/tcp/booking/reverse-tcp-request.interface";
import { ShiftDailyStatusTcp } from "@common/interfaces/tcp/shift-daily-status/shift-daily-status-tcp.interface";
import { ShiftDailyStatus } from "@common/schemas/slot/shift-daily-status.schema";
import { ObjectId } from "mongodb";


export const convertToShiftDailyStatus = (data: Partial<ShiftDailyStatusTcp>): Partial<ShiftDailyStatus> => {
    return {
        booking_id: data?.booking_id,
        date_reverse: data?.date_reverse,
        status: data?.status,
        id_expert: data?.id_expert,
        id_shift_in_day: new ObjectId(data?.id_shift_in_day),
        id_reverse: data?.id_reverse
    }
}