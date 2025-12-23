import { Injectable } from "@nestjs/common";
import { ShiftInWeekRepository } from "../repositories/shift-in-week.repository";
import { RegisterRepository } from "../../register/repository/register.repository";
import { ShiftInDayAmount } from "@common/interfaces/tcp/shift-in-day/shift-in-day-amount-employ-tcp.interface";
import { ObjectId } from "mongodb";

@Injectable()
export class ShiftInWeekService {
    constructor(private readonly shiftInWeekRepoitory: ShiftInWeekRepository,
        private readonly registerRepository: RegisterRepository,
        // private readonly shiftRepository: ShiftRepository
    ) { }


    async getAll() {
        const rs = await this.shiftInWeekRepoitory.getAll();

        // KẾT QUẢ TRẢ VỀ
        const kq: ShiftInDayAmount[] = [];

        for (const shiftInDay of rs) {
            const amountEmployee = await this.registerRepository.getByIdShiftInDay(new ObjectId(shiftInDay._id));

            kq.push({
                day: shiftInDay.day,
                amount: amountEmployee?.length || 0,
                shiftInfo: shiftInDay.shift_id
            });
        }

        return kq;
    }

    getById(id: string) {
        return this.shiftInWeekRepoitory.getById(id);
    }
}