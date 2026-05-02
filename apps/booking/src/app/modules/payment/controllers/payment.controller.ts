import { Controller, UseInterceptors } from "@nestjs/common";
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptors';
import { MessagePattern } from "@nestjs/microservices";
import { TCP_BOOKING_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { RequestParams } from "@common/decorators/request-params.decorator";
// import { ProcessId } from "@common/decorators/processid.decorator";
import { CreateLinkApiVnpayRequestTcp } from '@common/interfaces/tcp/booking/create-link-vnpay-tcp-request.interface';
import { PaymentService } from "../services/payment.service";
import { ResponseTcp } from "@common/interfaces/tcp/common/response-tcp.interface";

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class PaymentController {

    constructor(private readonly paymentService: PaymentService) { }

    // cái này để tạo link thanh toán
    @MessagePattern(TCP_BOOKING_SERVICE_MESSAGE.CREATE_LINK_PAYMENT)
    createLinkVnPay(@RequestParams() data: CreateLinkApiVnpayRequestTcp) {
        const rs = this.paymentService.createPaymentUrl(data);
        return ResponseTcp.success<{ link_payment: string }>({ link_payment: rs })
    }

    // cái này để xác nhận thanh toán
    @MessagePattern(TCP_BOOKING_SERVICE_MESSAGE.CONFIRM_PAYMENT_BOOKING)
    async confirmPaymentBooking(@RequestParams() data: { isValid: boolean, orderId: string, responseCode: string }) {
        const rs = await this.paymentService.verifyIpn(data);

        return ResponseTcp.success<{
            RspCode: string,
            Message: string,
        }>({ RspCode: rs.RspCode, Message: rs.Message });

    }


}   
