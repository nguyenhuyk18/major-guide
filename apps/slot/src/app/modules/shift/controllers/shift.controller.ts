import { BadRequestException, Controller, UseInterceptors } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { TCP_SLOT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { ShiftService } from "../services/shift.service";
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { ShiftResponseTcp } from '@common/interfaces/tcp/shift/shift-response-tcp.interface';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptors';
import { RequestParams } from '@common/decorators/request-params.decorator';

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class ShiftController {
    constructor(private readonly shiftService: ShiftService) { }

    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.GET_ALL_SLOT)
    async getAllShift() {
        const rs = await this.shiftService.getAllShift();
        return ResponseTcp.success<ShiftResponseTcp[]>(rs)
    }


    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.GET_SLOT_BY_ID)
    async getShiftById(@RequestParams() id: string) {

        const rs = await this.shiftService.getShiftById(id);
        if (!rs) {
            throw new BadRequestException('Không tìm thấy ca làm')
        }
        return ResponseTcp.success<ShiftResponseTcp>(rs);
    }
}