import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class StripeConfiguration {
    @IsString()
    @IsNotEmpty()
    SECRET_KEY = process.env['STRIPE_SECRET_KEY'] || '';

    @IsString()
    @IsNotEmpty()
    WEBHOOK_SECRET = process.env['STRIPE_WEBHOOK_SECRET'] || '';

    @IsString()
    @IsNotEmpty()
    SUCCESS_URL = process.env['STRIPE_SUCCESS_URL'] || 'http://localhost:3000/payment-success.html?session_id={CHECKOUT_SESSION_ID}';

    @IsString()
    @IsNotEmpty()
    CANCEL_URL = process.env['STRIPE_CANCEL_URL'] || 'http://localhost:3000/my-bookings?payment=cancelled';

    @IsString()
    @IsNotEmpty()
    CURRENCY = process.env['STRIPE_CURRENCY'] || 'vnd';

    @IsNumber()
    PLATFORM_FEE = Number(process.env['PAYMENT_PLATFORM_FEE'] || 45000);
}
