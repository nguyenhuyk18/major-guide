import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TCP_BOOKING_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { PaymentService, StripeWebhookPayload } from '../services/payment.service';

@Controller()
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @MessagePattern(TCP_BOOKING_SERVICE_MESSAGE.CREATE_STRIPE_CHECKOUT)
    async createCheckout(@RequestParams() data: { orderId: string; memberId: string }) {
        return ResponseTcp.success(await this.paymentService.createCheckoutSession(data));
    }

    @MessagePattern(TCP_BOOKING_SERVICE_MESSAGE.GET_STRIPE_CHECKOUT_STATUS)
    async getStatus(@RequestParams() data: { sessionId: string; memberId: string }) {
        return ResponseTcp.success(await this.paymentService.getCheckoutStatus(data.sessionId, data.memberId));
    }

    @MessagePattern(TCP_BOOKING_SERVICE_MESSAGE.PROCESS_STRIPE_WEBHOOK)
    async webhook(@RequestParams() data: StripeWebhookPayload) {
        return ResponseTcp.success(await this.paymentService.processWebhook(data));
    }
}
