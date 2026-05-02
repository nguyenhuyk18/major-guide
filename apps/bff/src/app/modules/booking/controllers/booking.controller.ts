import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TCP_BOOKING_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Body, Controller, Get, Inject, Param, Post, Query, Version } from "@nestjs/common";
import { ReverseGatewayRequest } from '@common/interfaces/gateway/booking/reverse-gateway-request.interface';
import { CreateBookingRequest } from '@common/interfaces/gateway/booking/create-booking-request.interface';
import { ResponseDto } from "@common/interfaces/gateway/response-gateway.dto";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ReverseTcpRequest } from '@common/interfaces/tcp/booking/reverse-tcp-request.interface';
import { CreateBookingTcpRequest } from '@common/interfaces/tcp/booking/create-booking-tcp-request.interface';
import { UserInfo } from "@common/decorators/get-user.decorator";
import { User } from "@common/schemas/user-access/user.schema";
import { Authorization } from "@common/decorators/authorizer.decorator";
import { Roles } from "@common/decorators/role.decorator";
import { ROLE } from "@common/constant/enum/action.constant";
import { firstValueFrom, map } from 'rxjs';
import { PaginationResponse } from '@common/interfaces/tcp/common/pagegination-tcp.interface';


@ApiTags('Booking')
@Controller('book')
export class BookingController {

    constructor(@Inject(TCP_SERVICE.BOOKING_SERVICE) private readonly bookingService: TcpClient) { }

    @Post()
    @ApiOkResponse({ type: ResponseDto })
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER, ROLE.ADMIN])
    @ApiOperation({ summary: 'API đặt chỗ chuyên gia mà họ muốn !!!!' })
    async reserveSlot(@Body() data: ReverseGatewayRequest, @ProcessId() processId: string, @UserInfo() userInfo: User) {
        // return 1;
        // console.log('ghsgs')
        const rs = await firstValueFrom(this.bookingService.send<void, ReverseTcpRequest>(TCP_BOOKING_SERVICE_MESSAGE.SAVE_REVERSE, { data: { day_support: data.day_support, id_expert: data.id_expert, id_member: userInfo.id, time_end: data.time_end, time_start: data.time_start, id_shift_in_day: data.id_shift_in_day, price_support: data.price_support, avatar_expert: data.avatar_expert, name_customer: data.name_customer, name_expert: data.name_expert, email_customer: userInfo.email }, processId }).pipe(map(row => new ResponseDto(row))));
        return new ResponseDto({ data: rs.data })
    }

    @Version('2')
    @Post()
    @ApiOkResponse({ type: ResponseDto })
    @Authorization({ secured: true })   
    @Roles([ROLE.MEMBER, ROLE.ADMIN])
    @ApiOperation({ summary: 'API đặt chỗ chuyên gia (v2) - Tạo booking và trả về order_id để FE tạo link thanh toán' })
    async createBookingV2(@Body() data: CreateBookingRequest, @ProcessId() processId: string, @UserInfo() userInfo: User) {
        const payload: CreateBookingTcpRequest = {
            id_expert: data.id_expert,
            id_shift_in_day: data.id_shift_in_day,
            day_support: data.day_support,
            time_start: data.time_start,
            time_end: data.time_end,
            price_support: data.price_support,
            name_customer: data.name_customer,
            name_expert: data.name_expert,
            avatar_expert: data.avatar_expert,
            note: data.note,
            id_member: userInfo.id,
            email_customer: userInfo.email,
        };

        const result = await firstValueFrom(
            this.bookingService.send<any, CreateBookingTcpRequest>(
                TCP_BOOKING_SERVICE_MESSAGE.CREATE_BOOKING,
                { data: payload, processId }
            )
        );
        console.log(  result  )
        return new ResponseDto(result.data);
    }

    @Get('my-bookings/:id_member')
    @ApiOkResponse({ type: ResponseDto })
    @Authorization({ secured: true })
    @Roles([ ROLE.MEMBER ])
    @ApiOperation({ summary: 'API lấy toàn bộ booking của member hiện tại' })
    async getMyBookings(@ProcessId() processId: string, @Param('id_member') id_member: string) {
        const result = await firstValueFrom(
            this.bookingService.send<any, { memberId: string }>(
                TCP_BOOKING_SERVICE_MESSAGE.GET_BOOKING_BY_MEMBER,
                { data: { memberId: id_member }, processId }
            )
        );
        return new ResponseDto(result.data);
    }

    @Get('expert-bookings')
    @ApiOkResponse({ type: ResponseDto })
    @Authorization({ secured: true })
    @Roles([ROLE.EXPERT])
    @ApiOperation({ summary: 'API lấy danh sách booking đã thanh toán của chuyên gia (có phân trang)' })
    async getExpertBookings(
        @ProcessId() processId: string,
        @UserInfo() userInfo: User,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        const result = await firstValueFrom(
            this.bookingService.send<PaginationResponse<any>, { expertId: string, page?: number, limit?: number }>(
                TCP_BOOKING_SERVICE_MESSAGE.GET_BOOKING_BY_EXPERT,
                { data: { expertId: userInfo.id, page: page || 1, limit: limit || 10 }, processId }
            ).pipe(map(row => row.data))
        );
        return result;
    }
}