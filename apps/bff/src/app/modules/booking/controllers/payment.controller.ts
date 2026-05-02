import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Body, Controller, Inject, Post } from "@nestjs/common";
import { CreateLinkApiVnpayRequest } from "@common/interfaces/gateway/booking/create-link-vnpay-request.interface"
import { User } from "@common/schemas/user-access/user.schema";
import { UserInfo } from "@common/decorators/get-user.decorator";
import { ProcessId } from "@common/decorators/processid.decorator";
import { Authorization } from "@common/decorators/authorizer.decorator";
import { Roles } from "@common/decorators/role.decorator";
import { ROLE } from "@common/constant/enum/action.constant";
import { firstValueFrom, map } from 'rxjs';
import { CreateLinkApiVnpayRequestTcp } from '@common/interfaces/tcp/booking/create-link-vnpay-tcp-request.interface';
import { TCP_BOOKING_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ResponseDto } from "@common/interfaces/gateway/response-gateway.dto";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
    constructor(@Inject(TCP_SERVICE.BOOKING_SERVICE) private readonly bookingService: TcpClient) { }

    @Post('create-link')
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER])
    async createLinkPayment(@Body() data: CreateLinkApiVnpayRequest, @ProcessId() processId: string, @UserInfo() userInfo: User) {
        const rs = await firstValueFrom(this.bookingService.send<{ link_payment: string }, CreateLinkApiVnpayRequestTcp>(TCP_BOOKING_SERVICE_MESSAGE.CREATE_LINK_PAYMENT, { data, processId }).pipe(map(row => new ResponseDto<{ link_payment: string }>(row))));
        return rs;
    }

    // xác nhận thanh toán
    @Post('confirm')
    @ApiOperation({ summary: 'API Confirm thanh toán đơn hàng  !!!!' })
    async confirmPayment(@Body() data: { isValid: boolean, orderId: string, responseCode: string }, @ProcessId() processId: string) {
        const rs = await firstValueFrom(this.bookingService.send<{
            RspCode: string,
            Message: string,
        }, { isValid: boolean, orderId: string, responseCode: string }>(TCP_BOOKING_SERVICE_MESSAGE.CONFIRM_PAYMENT_BOOKING, { data, processId }).pipe(map(row => new ResponseDto<{
            RspCode: string,
            Message: string,
        }>(row))));

        return rs;
    }






}