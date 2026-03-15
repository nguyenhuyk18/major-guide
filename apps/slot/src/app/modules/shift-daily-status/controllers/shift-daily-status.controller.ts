import { Controller, Logger, UseInterceptors } from "@nestjs/common";
import { ShiftDailyStatusService } from "../services/shift-daily-status.service";
import { TcpLoggingInterceptor } from "@common/interceptors/tcpLogging.interceptors";
import { Ctx, EventPattern, RmqContext } from "@nestjs/microservices";
import { BOOKING_SERVICE_RABBIT_MESSAGE } from '@common/constant/enum/rabbitmq-message.constant';
import { RequestParams } from "@common/decorators/request-params.decorator";
import { ShiftDailyStatusTcp } from "@common/interfaces/tcp/shift-daily-status/shift-daily-status-tcp.interface";
import { STATUS_SLOT } from "@common/constant/enum/status_slot.contant";
// import { ROUTING_KEY_NAME } from "@common/constant/enum/queuename.constant";

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class ShiftDailyStatusController {
    constructor(private readonly shiftDailyStatusService: ShiftDailyStatusService) { }

    @EventPattern(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_ADD_RESERVE)
    addSlotHolding(@RequestParams() data: ShiftDailyStatusTcp, @Ctx() context: RmqContext) {
        // console.log(data);
        this.shiftDailyStatusService.saveShiftDailyStatus(data);
        context.getChannelRef().ack(context.getMessage());
    }



    @EventPattern(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_CHECK_REVERSE)
    cancleSlotHolding(@RequestParams() data: { uuid: string, status: STATUS_SLOT }, @Ctx() context: RmqContext) {
        Logger.log('Hello đang check sau 5p');
        this.shiftDailyStatusService.cancleSlotNotPay(data.uuid, data.status);
        context.getChannelRef().ack(context.getMessage());
    }
}
