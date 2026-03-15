import { Controller, Inject, Logger } from "@nestjs/common";
import { Ctx, EventPattern, RmqContext } from "@nestjs/microservices";
import { TCP_BOOKING_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { ReverseTcpRequest } from '@common/interfaces/tcp/booking/reverse-tcp-request.interface';
import { ReverseService } from "../services/reverse.service";
import { v4 } from 'uuid'
import { RABBIT_SERVICE } from "@common/configuration/rabbit.config";
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { ShiftDailyStatusTcp } from '@common/interfaces/tcp/shift-daily-status/shift-daily-status-tcp.interface';
import { BOOKING_SERVICE_RABBIT_MESSAGE } from '@common/constant/enum/rabbitmq-message.constant';
import { ProcessId } from '@common/decorators/processid.decorator';
import { STATUS_BOOKING, STATUS_SLOT } from "@common/constant/enum/status_slot.contant";
// import { ROUTING_KEY_NAME } from "@common/constant/enum/queuename.constant";`


@Controller()
export class ReverseController {
    constructor(private readonly reverseService: ReverseService,
        @Inject(RABBIT_SERVICE.BOOKING_HOLD_DEMAND) private readonly slotDemandHold: TcpClient,
        @Inject(RABBIT_SERVICE.BOOKING_HOLD_DELAY) private readonly slotDelayHold: TcpClient,
        // @Inject(RABBIT_SERVICE.BOOKING_HOLD_CANCEL) private readonly slotCancleHold: TcpClient
    ) { }

    @EventPattern(TCP_BOOKING_SERVICE_MESSAGE.SAVE_REVERSE)
    async addReverse(@RequestParams() data: ReverseTcpRequest, @ProcessId() processId: string) {

        const iduu = v4();

        // check xem lich nay co ng dat ch 


        const rs = await this.reverseService.addReverse(data, iduu);

        this.slotDemandHold.emit<void, ShiftDailyStatusTcp>(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_ADD_RESERVE, { processId, data: { booking_id: rs.id, date_reverse: new Date(), id_expert: data.id_expert, id_reverse: iduu, id_shift_in_day: data.id_shift_in_day, status: STATUS_SLOT.HOLDING } });


        Logger.log(processId + 'đã publish vào queue delay chờ đợi 1p')
        // push tin nhắn để check sau 5p
        this.slotDelayHold.emit<void, { uuid: string, status: STATUS_SLOT }>(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_CHECK_REVERSE, { data: { uuid: iduu, status: STATUS_SLOT.CANCLE }, processId: processId });


    }




    @EventPattern(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_CHECK_REVERSE)
    cancleSlotHolding(@RequestParams() data: { uuid: string, status: STATUS_SLOT }, @Ctx() context: RmqContext) {
        // Logger.log('Hello đang check sau 5p');
        this.reverseService.updateReverseStatusReverse(data.uuid, STATUS_BOOKING.CANCLE);
        context.getChannelRef().ack(context.getMessage());
    }
}