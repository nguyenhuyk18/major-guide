import { STATUS_BOOKING } from "@common/constant/enum/status_slot.contant";
import { ReverseTcpRequest } from "@common/interfaces/tcp/booking/reverse-tcp-request.interface";
import { Reverse } from "@common/schemas/booking/reverse.schema";

export const mappingToReverse = (data: Partial<ReverseTcpRequest>, id_reverse: string): Partial<Reverse> => {
    return {
        day_support: data.day_support,
        id_expert: data.id_expert,
        id_member: data.id_member,
        time_end: data.time_end,
        time_start: data.time_start,
        status: STATUS_BOOKING.RESERVED,
        price_support: data.price_support,
        id_reverse: id_reverse
    }
}