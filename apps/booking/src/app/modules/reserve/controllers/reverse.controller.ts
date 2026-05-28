import { Controller, Inject, Logger } from "@nestjs/common";
import { Ctx, EventPattern, MessagePattern, RmqContext } from "@nestjs/microservices";
import { TCP_BOOKING_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { ReverseTcpRequest } from '@common/interfaces/tcp/booking/reverse-tcp-request.interface';
import { CreateBookingTcpRequest } from '@common/interfaces/tcp/booking/create-booking-tcp-request.interface';
import { ExpertJoinBookingTcpRequest } from '@common/interfaces/tcp/booking/expert-join-booking-tcp-request.interface';
import { ReverseService } from "../services/reverse.service";
import { v4 } from 'uuid'
import { RABBIT_SERVICE } from "@common/configuration/rabbit.config";
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { ShiftDailyStatusTcp } from '@common/interfaces/tcp/shift-daily-status/shift-daily-status-tcp.interface';
import { BOOKING_SERVICE_RABBIT_MESSAGE, MAIL_SERVICE_RABBIT_MESSAGE } from '@common/constant/enum/rabbitmq-message.constant';
import { ProcessId } from '@common/decorators/processid.decorator';
import { STATUS_BOOKING, STATUS_SLOT } from "@common/constant/enum/status_slot.contant";
import { EinvoiceMailRequest } from '@common/interfaces/tcp/mail/einvoice-mail.interface';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
// import { ROUTING_KEY_NAME } from "@common/constant/enum/queuename.constant";`


@Controller()
export class ReverseController {
    constructor(private readonly reverseService: ReverseService,
        @Inject(RABBIT_SERVICE.BOOKING_HOLD_DEMAND) private readonly slotDemandHold: TcpClient,
        @Inject(RABBIT_SERVICE.BOOKING_HOLD_DELAY) private readonly slotDelayHold: TcpClient,
        @Inject(RABBIT_SERVICE.MAIL_SERVICE) private readonly mailClient: TcpClient,
        // @Inject(RABBIT_SERVICE.BOOKING_HOLD_CANCEL) private readonly slotCancleHold: TcpClient
    ) { }

    @MessagePattern(TCP_BOOKING_SERVICE_MESSAGE.SAVE_REVERSE)
    async addReverse(@RequestParams() data: ReverseTcpRequest, @ProcessId() processId: string) {

        const iduu = v4();
        const rs = await this.reverseService.addReverse(data, iduu);

        this.slotDemandHold.emit<void, ShiftDailyStatusTcp>(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_ADD_RESERVE, { processId, data: { booking_id: rs.id, date_reverse: data.day_support, id_expert: data.id_expert, id_reverse: iduu, id_shift_in_day: data.id_shift_in_day, status: STATUS_SLOT.HOLDING } });

        Logger.log(processId + 'đã publish vào queue delay chờ đợi 30p')
        // push tin nhắn để check sau 30p
        this.slotDelayHold.emit<void, { uuid: string, status: STATUS_SLOT }>(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_CHECK_REVERSE, { data: { uuid: iduu, status: STATUS_SLOT.AVAILABLE }, processId: processId });

        // gửi mail hóa đơn cho người dùng
        const invoicePayload: EinvoiceMailRequest = {
            name: data.name_customer,
            email: data.email_customer,
            subject: 'Xác nhận đặt lịch tư vấn - Major Guide',
            nameCustomer: data.name_customer,
            avartarExpert: data.avatar_expert,
            nameExpert: data.name_expert,
            priceTotal: data.price_support,
            daySupport: data.day_support,
            startTime: data.time_start,
            endTime: data.time_end,
            // paymentLink: data.payment_link
        };

        this.mailClient.emit<void, EinvoiceMailRequest>(
            MAIL_SERVICE_RABBIT_MESSAGE.SEND_EINVOICE,
            { data: invoicePayload, processId }
        );

        Logger.log(processId + ' đã emit SEND_EINVOICE → mail service');
        return ResponseTcp.success({
            // message: 'Booking created successfully. Please proceed with payment.'
            order_id: iduu,
            booking_id: rs.id,
            message: 'Booking created successfully. Please proceed with payment.'
        });
    }




    @EventPattern(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_CHECK_REVERSE)
    cancleSlotHolding(@RequestParams() data: { uuid: string, status: STATUS_SLOT }, @Ctx() context: RmqContext) {
        // Logger.log('Hello đang check sau 5p');
        this.reverseService.updateReverseStatusReverse(data.uuid, STATUS_BOOKING.CANCLE);
        context.getChannelRef().ack(context.getMessage());
    }

    @MessagePattern(TCP_BOOKING_SERVICE_MESSAGE.GET_BOOKING_BY_MEMBER)
    async getBookingsByMember(@RequestParams() data: { memberId: string }) {
        const bookings = await this.reverseService.getBookingsByMemberId(data.memberId);
        return ResponseTcp.success(bookings);
    }

    @MessagePattern(TCP_BOOKING_SERVICE_MESSAGE.CREATE_BOOKING)
    async createBooking(@RequestParams() data: CreateBookingTcpRequest, @ProcessId() processId: string) {
        const id_reverse = v4();
        const rs = await this.reverseService.createBooking(data, id_reverse);

        // Emit slot holding event
        this.slotDemandHold.emit<void, ShiftDailyStatusTcp>(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_ADD_RESERVE, { 
            processId, 
            data: { 
                booking_id: rs.id, 
                date_reverse: data.day_support, 
                id_expert: data.id_expert, 
                id_reverse: id_reverse, 
                id_shift_in_day: data.id_shift_in_day, 
                status: STATUS_SLOT.HOLDING 
            } 
        });

        Logger.log(processId + 'đã publish vào queue delay chờ đợi 5 phút');

        // push tin nhắn để check sau 5p
        this.slotDelayHold.emit<void, { uuid: string, status: STATUS_SLOT }>(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_CHECK_REVERSE, { data: { uuid: id_reverse, status: STATUS_SLOT.AVAILABLE }, processId: processId });

        return ResponseTcp.success({
            order_id: id_reverse,
            booking_id: rs.id,
            message: 'Booking created successfully. Please proceed with payment.'
        });
    }

    @MessagePattern(TCP_BOOKING_SERVICE_MESSAGE.GET_BOOKING_BY_EXPERT)
    async getBookingsByExpert(@RequestParams() data: { expertId: string, page?: number, limit?: number }) {
        const page = data.page || 1;
        const limit = data.limit || 10;
        const result = await this.reverseService.getBookingsByExpertId(data.expertId, page, limit);
        return ResponseTcp.success(result);
    }

    @MessagePattern(TCP_BOOKING_SERVICE_MESSAGE.EXPERT_JOIN_BOOKING)
    async expertJoinBooking(@RequestParams() data: ExpertJoinBookingTcpRequest, @ProcessId() processId: string) {
        try {
            const result = await this.reverseService.expertJoinBooking(data.expertId, data.bookingId);
            Logger.log(processId + ' Expert joined booking: ' + data.bookingId);
            return ResponseTcp.success(result);
        } catch (error: any) {
            Logger.error(processId + ' Expert join booking failed: ' + error.message);
            return ResponseTcp.error(error.message);
        }
    }
}