import { STATUS_SLOT } from '@common/constant/enum/status_slot.contant';
export class ShiftDailyStatusTcp {
    id_shift_in_day: string;

    id_expert: string;

    booking_id: string;

    date_reverse: string;

    status: STATUS_SLOT;

    id_reverse: string;


}

export interface ShiftDailyStatusCheckRequest {
    date_reverse: string;
    id_shift_in_day: string;
    id_expert: string;
}

export interface ShiftDailyStatusCheckResponse {
    status: STATUS_SLOT | null;
    is_available: boolean;
}
