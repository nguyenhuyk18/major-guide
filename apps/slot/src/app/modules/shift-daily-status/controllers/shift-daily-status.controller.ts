import { Controller, Logger, UseInterceptors } from "@nestjs/common";
import { ShiftDailyStatusService } from "../services/shift-daily-status.service";
import { TcpLoggingInterceptor } from "@common/interceptors/tcpLogging.interceptors";
import { Ctx, EventPattern, MessagePattern, RmqContext } from "@nestjs/microservices";
import { BOOKING_SERVICE_RABBIT_MESSAGE } from '@common/constant/enum/rabbitmq-message.constant';
import { RequestParams } from "@common/decorators/request-params.decorator";
import { ShiftDailyStatusCheckRequest, ShiftDailyStatusCheckResponse, ShiftDailyStatusTcp } from "@common/interfaces/tcp/shift-daily-status/shift-daily-status-tcp.interface";
import { STATUS_SLOT } from "@common/constant/enum/status_slot.contant";
import { TCP_SLOT_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ResponseTcp } from "@common/interfaces/tcp/common/response-tcp.interface";
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


    @EventPattern(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_SUCCESS_STATUS)
    successSlotHolding(@RequestParams() data: { uuid_reverse: string, status_hold: STATUS_SLOT }, @Ctx() context: RmqContext) {
        Logger.log("Hello tôi đến đây để success or cancle slot ")
        this.shiftDailyStatusService.successSlotPay(data.uuid_reverse, data.status_hold);
        context.getChannelRef().ack(context.getMessage());
    }


    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_DAILY_SLOT)
    async getShiftDailySlot(@RequestParams() data: ShiftDailyStatusCheckRequest) {

        const rs = await this.shiftDailyStatusService.getSlotStatus(
            data.date_reverse,
            data.id_shift_in_day,
            data.id_expert
        );
        return ResponseTcp.success<ShiftDailyStatusCheckResponse>(rs);
    }

}
