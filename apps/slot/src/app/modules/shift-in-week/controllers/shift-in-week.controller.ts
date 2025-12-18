import { Controller } from "@nestjs/common";
import { ShiftInWeekService } from "../services/shift-in-week.service";
import { MessagePattern } from "@nestjs/microservices";
import { TCP_SLOT_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ResponseTcp } from "@common/interfaces/tcp/common/response-tcp.interface";
import { RequestParams } from "@common/decorators/request-params.decorator";
import { ShiftInDayTcpResponse } from '@common/interfaces/tcp/shift-in-day/shift-in-day-response-tcp.interface';

@Controller()
export class ShiftInWeekController {
    constructor(private readonly shiftInWeekService: ShiftInWeekService) { }

    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_IN_DAY)
    async getAll() {
        console.log('hahahaahahahaha')
        const rs = await this.shiftInWeekService.getAll();
        return ResponseTcp.success<ShiftInDayTcpResponse[]>(rs);
    }


    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_IN_DAY_BY_ID)
    async getById(@RequestParams() data: string) {
        const rs = await this.shiftInWeekService.getById(data);
        return ResponseTcp.success<ShiftInDayTcpResponse>(rs);
    }
}