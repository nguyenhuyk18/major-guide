import { BadRequestException, Controller } from "@nestjs/common";
import { ShiftInWeekService } from "../services/shift-in-week.service";
import { MessagePattern } from "@nestjs/microservices";
import { TCP_SLOT_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ResponseTcp } from "@common/interfaces/tcp/common/response-tcp.interface";
import { RequestParams } from "@common/decorators/request-params.decorator";
import { ShiftInDayTcpByIdResponse } from '@common/interfaces/tcp/shift-in-day/shift-in-day-response-tcp.interface';
import { ShiftInDayAmount } from '@common/interfaces/tcp/shift-in-day/shift-in-day-amount-employ-tcp.interface';

@Controller()
export class ShiftInWeekController {
    constructor(private readonly shiftInWeekService: ShiftInWeekService) { }

    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_IN_DAY)
    async getAll(@RequestParams() param: { endTime: Date, startTime: Date }) {
        // console.log('hahahaahahaahaha')
        const rs = await this.shiftInWeekService.getAll(param.startTime, param.endTime);
        return ResponseTcp.success<ShiftInDayAmount[]>(rs);
    }



    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_IN_DAY_BY_ID)
    async getById(@RequestParams() data: { id: string, specify_time: string }) {

        if (!data.specify_time) {
            throw new BadRequestException('Chưa truyền về thời gian ca chỉ định !!!');
        }

        const rs = await this.shiftInWeekService.getById(data.id, new Date(data.specify_time));
        return ResponseTcp.success<ShiftInDayTcpByIdResponse>(rs);
    }
}