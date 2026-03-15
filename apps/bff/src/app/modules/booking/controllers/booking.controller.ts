import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TCP_BOOKING_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Body, Controller, Inject, Post } from "@nestjs/common";
import { ReverseGatewayRequest } from '@common/interfaces/gateway/booking/reverse-gateway-request.interface';
import { ResponseDto } from "@common/interfaces/gateway/response-gateway.dto";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { ReverseTcpRequest } from '@common/interfaces/tcp/booking/reverse-tcp-request.interface';
import { UserInfo } from "@common/decorators/get-user.decorator";
import { User } from "@common/schemas/user-access/user.schema";
import { Authorization } from "@common/decorators/authorizer.decorator";
import { Roles } from "@common/decorators/role.decorator";
import { ROLE } from "@common/constant/enum/action.constant";


@Controller('book')
export class BookingController {

    constructor(@Inject(TCP_SERVICE.BOOKING_SERVICE) private readonly bookingService: TcpClient) { }

    @Post()
    @ApiOkResponse({ type: ResponseDto })
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER, ROLE.ADMIN])
    @ApiOperation({ summary: 'API đặt chỗ chuyên gia mà họ muốn !!!!' })
    reserveSlot(@Body() data: ReverseGatewayRequest, @ProcessId() processId: string, @UserInfo() userInfo: User) {
        // return 1;
        this.bookingService.emit<void, ReverseTcpRequest>(TCP_BOOKING_SERVICE_MESSAGE.SAVE_REVERSE, { data: { day_support: data.day_support, id_expert: data.id_expert, id_member: userInfo.id, time_end: data.time_end, time_start: data.time_start, id_shift_in_day: data.id_shift_in_day, price_support: data.price_support }, processId });

        return new ResponseDto({ data: 'Bạn đã đặt chỗ thành công , vui lòng thanh toán ngay !!!' });
    }
}