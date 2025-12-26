import { Injectable } from "@nestjs/common";
import { ShiftInWeekRepository } from "../repositories/shift-in-week.repository";
import { RegisterRepository } from "../../register/repository/register.repository";
import { ShiftInDayAmount } from "@common/interfaces/tcp/shift-in-day/shift-in-day-amount-employ-tcp.interface";
import { ObjectId } from "mongodb";

import { Register } from "@common/schemas/slot/register.schema";
import { RegisterTcpWithUserResponse } from "@common/interfaces/tcp/register";
import { ShiftInWeek } from "@common/schemas/slot/shift-of-day.schema";
import { ShiftInDayTcpByIdResponse } from "@common/interfaces/tcp/shift-in-day";

@Injectable()
export class ShiftInWeekService {
    constructor(private readonly shiftInWeekRepoitory: ShiftInWeekRepository,
        private readonly registerRepository: RegisterRepository
    ) { }


    async getAll() {
        const rs = await this.shiftInWeekRepoitory.getAll();

        const convertData = rs.map(async row => {
            const amountEmployee = await this.registerRepository.getByIdShiftInDay(new ObjectId(row._id));

            return {
                day: row.day,
                amount: amountEmployee?.length || 0,
                shiftInfo: row.shift_id,
                id: row.id
            }
        })


        const kq: ShiftInDayAmount[] = await Promise.all(convertData)

        return kq;
    }

    async getById(id: string): Promise<ShiftInDayTcpByIdResponse> {
        const allRegister: (RegisterTcpWithUserResponse[] | Register[]) = await this.registerRepository.getByIdShiftInDay(new ObjectId(id), true);

        const shiftInDayInfo: ShiftInWeek = await this.shiftInWeekRepoitory.getById(id);

        return {
            register: allRegister,
            shiftInfo: shiftInDayInfo
        };
    }
}