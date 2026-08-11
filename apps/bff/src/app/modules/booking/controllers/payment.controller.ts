import { BadRequestException, Body, Controller, Get, Headers, Inject, Param, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import Stripe from 'stripe';
import { firstValueFrom } from 'rxjs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TCP_SERVICE } from '@common/configuration/tcp.config';
import { TCP_BOOKING_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { ProcessId } from '@common/decorators/processid.decorator';
import { UserInfo } from '@common/decorators/get-user.decorator';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { Roles } from '@common/decorators/role.decorator';
import { ROLE } from '@common/constant/enum/action.constant';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { User } from '@common/schemas/user-access/user.schema';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
    private readonly stripe: Stripe;
    private readonly webhookSecret: string;

    constructor(
        @Inject(TCP_SERVICE.BOOKING_SERVICE) private readonly bookingService: TcpClient,
        config: ConfigService,
    ) {
        this.stripe = new Stripe(config.getOrThrow<string>('STRIPE_CONFIG.SECRET_KEY'));
        this.webhookSecret = config.getOrThrow<string>('STRIPE_CONFIG.WEBHOOK_SECRET');
    }

    @Post('checkout-session')
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER])
    @ApiOperation({ summary: 'Tạo Stripe Checkout Session cho booking' })
    async createCheckout(
        @Body() data: { orderId: string },
        @UserInfo() user: User,
        @ProcessId() processId: string,
    ) {
        if (!data?.orderId) throw new BadRequestException('orderId là bắt buộc');
        const result = await firstValueFrom(this.bookingService.send<any, { orderId: string; memberId: string }>(
            TCP_BOOKING_SERVICE_MESSAGE.CREATE_STRIPE_CHECKOUT,
            { data: { orderId: data.orderId, memberId: user.id }, processId },
        ));
        return new ResponseDto({ data: result.data });
    }

    @Get('checkout-session/:sessionId/status')
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER])
    @ApiOperation({ summary: 'Kiểm tra trạng thái Stripe Checkout Session' })
    async getStatus(
        @Param('sessionId') sessionId: string,
        @UserInfo() user: User,
        @ProcessId() processId: string,
    ) {
        const result = await firstValueFrom(this.bookingService.send<any, { sessionId: string; memberId: string }>(
            TCP_BOOKING_SERVICE_MESSAGE.GET_STRIPE_CHECKOUT_STATUS,
            { data: { sessionId, memberId: user.id }, processId },
        ));
        return new ResponseDto({ data: result.data });
    }

    @Post('stripe/webhook')
    @ApiOperation({ summary: 'Stripe webhook (signature required)' })
    async stripeWebhook(
        @Req() request: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
        @ProcessId() processId: string,
    ) {
        if (!signature || !request.rawBody) throw new BadRequestException('Thiếu Stripe signature hoặc raw body');

        let event: Stripe.Event;
        try {
            event = this.stripe.webhooks.constructEvent(request.rawBody, signature, this.webhookSecret);
        } catch (error: any) {
            throw new BadRequestException(`Stripe webhook không hợp lệ: ${error.message}`);
        }

        const supported = [
            'checkout.session.completed',
            'checkout.session.async_payment_succeeded',
            'checkout.session.async_payment_failed',
            'checkout.session.expired',
        ];
        if (!supported.includes(event.type)) return new ResponseDto({ data: { received: true, processed: false } });

        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
        const payload = {
            type: event.type,
            sessionId: session.id,
            paymentStatus: session.payment_status,
            paymentIntentId,
            amountTotal: session.amount_total ?? undefined,
            currency: session.currency ?? undefined,
            bookingId: session.metadata?.bookingId,
            memberId: session.metadata?.memberId,
        };
        const result = await firstValueFrom(this.bookingService.send<any, typeof payload>(
            TCP_BOOKING_SERVICE_MESSAGE.PROCESS_STRIPE_WEBHOOK,
            { data: payload, processId },
        ));
        return new ResponseDto({ data: result.data });
    }
}
