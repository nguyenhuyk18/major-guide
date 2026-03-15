import { Injectable } from "@nestjs/common";
import { ShiftDailyStatusRepository } from "../repositories/shift-daily-status.repository";
import { ShiftDailyStatusTcp } from '@common/interfaces/tcp/shift-daily-status/shift-daily-status-tcp.interface';
import { convertToShiftDailyStatus } from "../mappers";
import { STATUS_SLOT } from "@common/constant/enum/status_slot.contant";

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


}