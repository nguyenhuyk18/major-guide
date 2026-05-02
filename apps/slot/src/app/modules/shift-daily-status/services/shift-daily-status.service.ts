import { Injectable } from "@nestjs/common";
import { ShiftDailyStatusRepository } from "../repositories/shift-daily-status.repository";
import { ShiftDailyStatusCheckResponse, ShiftDailyStatusTcp } from '@common/interfaces/tcp/shift-daily-status/shift-daily-status-tcp.interface';
import { convertToShiftDailyStatus } from "../mappers";
import { STATUS_SLOT } from "@common/constant/enum/status_slot.contant";
import { ShiftDailyStatus } from "@common/schemas/slot/shift-daily-status.schema";

@Injectable()
export class ShiftDailyStatusService {
    constructor(private readonly shiftDailyStatusRepository: ShiftDailyStatusRepository) { }

    saveShiftDailyStatus(data: ShiftDailyStatusTcp) {
        const newData = convertToShiftDailyStatus(data);
        return this.shiftDailyStatusRepository.create(newData);
    }


    async cancleSlotNotPay(uu_id: string, status: STATUS_SLOT) {
        // const newdata = convertToShiftDailyStatus({ status: status });

        // console.log(uu_id);

        const rs = await this.shiftDailyStatusRepository.findByIdReverse(uu_id);
        // console.log(rs);
        if (!rs) {
            return;
        }

        if (rs.status === STATUS_SLOT.CANCLE || rs.status === STATUS_SLOT.AVAILABLE) {
            return;
        }

        return this.shiftDailyStatusRepository.updateByUuid(uu_id, { status: status });
    }


    async successSlotPay(uu_id: string, status_hold: STATUS_SLOT) {
        const rs = await this.shiftDailyStatusRepository.findByIdReverse(uu_id);

        if (!rs) {
            return;
        }

        return this.shiftDailyStatusRepository.updateByUuid(uu_id, { status: status_hold });
    }


    async getSlotStatus(date_reverse: Date, id_shift_in_day: string, id_expert: string): Promise<ShiftDailyStatusCheckResponse> {
        const record = await this.shiftDailyStatusRepository.findByDateAndShiftAndExpert(
            new Date(date_reverse),
            id_shift_in_day,
            id_expert
        );

        const tmp: ShiftDailyStatus = null;

        // console.log(record)

        for (const data of record) {
            // chỉ cần có 1 slot đang available hoặc holding thì ng khác kh được đặt
            if (data.status === STATUS_SLOT.ORDERED || data.status === STATUS_SLOT.HOLDING || data.status === STATUS_SLOT.CANCLE) {
                return { status: data.status, is_available: false }
            }
        }

        return { status: tmp?.status || STATUS_SLOT.AVAILABLE, is_available: true };
    }


}
