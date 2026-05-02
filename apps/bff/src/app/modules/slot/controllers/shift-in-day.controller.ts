import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Controller, Get, Inject, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { firstValueFrom, map } from "rxjs";
import { ShiftInDayTcpByIdResponse } from '@common/interfaces/tcp/shift-in-day/shift-in-day-response-tcp.interface';
import { TCP_SLOT_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
import { ResponseDto } from "@common/interfaces/gateway/response-gateway.dto";
import { ShiftInDayAmount } from '@common/interfaces/tcp/shift-in-day/shift-in-day-amount-employ-tcp.interface';
import { getCurrentWeek } from '@common/utils/common/convert-time.util';
import { Authorization } from "@common/decorators/authorizer.decorator";
import { Roles } from "@common/decorators/role.decorator";
import { ROLE } from "@common/constant/enum/action.constant";
import { ShiftInWeek } from "@common/schemas/slot/shift-of-day.schema";
import { ShiftInWeekInterface } from "@common/interfaces/tcp/shift-in-day/shiftinday-tcp.interface";
@Controller('shift-in-day')
@ApiTags('Shift In Day')
export class ShiftInDayController {
    constructor(@Inject(TCP_SERVICE.SLOT_SERVICE) private shiftInDayClient: TcpClient) { }

    @Get('only-shift')
    @ApiOkResponse({ type: ResponseDto<ShiftInWeek[]> })
    @ApiOperation({ summary: 'Api nay chi de lay toan bo shift in day' })
    // @Authorization({ secured: true })
    // @Roles([ROLE.EXPERT])
    async getOnlyShift(@ProcessId() processId: string) {
        const rs = await firstValueFrom(this.shiftInDayClient.send<ShiftInWeek[], string>(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_IN_DAY_WITHOUT_COUNT, { processId }).pipe(map(row => row.data)));

        return new ResponseDto<ShiftInWeek[]>({ data: rs });
    }


    // lấy ra các ca trong ngày đồng thời đếm luôn ca đó có bao nhiêu chuyên gia thường trực 
    @Get()
    @ApiOkResponse({ type: ResponseDto<ShiftInDayAmount[]> })
    @ApiQuery({ name: 'start_time', required: false, type: String })
    @ApiQuery({ name: 'end_time', required: false, type: String })
    @ApiOperation({ summary: 'Api này để xem được các ca trong 1 ngày nhắm giúp dễ truy vấn số chuyên gia trong ca đấy' })
    @Authorization({ secured: true })
    @Roles([ROLE.ADMIN])
    async getAll(@ProcessId() processId: string, @Query('start_time') startTime?: string, @Query('end_time') endTime?: string) {
        const tmp = getCurrentWeek();

        let start = tmp[0];
        let end = tmp[tmp.length - 1];

        if (startTime && endTime) {
            start = new Date(startTime);
            end = new Date(endTime);
        }

        const rs = await firstValueFrom(this.shiftInDayClient.send<ShiftInDayAmount[], { endTime: Date, startTime: Date }>(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_IN_DAY, { data: { endTime: end, startTime: start }, processId }).pipe(map(row => row.data)));


        return new ResponseDto<ShiftInDayAmount[]>({ data: rs })
    }

    // liệt kê ca trong ngày đó có bao nhiêu chuyên gia
    @Get(':id')
    @ApiOkResponse({ type: ResponseDto<ShiftInDayTcpByIdResponse> })
    @ApiOperation({ summary: 'Api này để xem các chuyên gia có trong ca đó' })
    @Authorization({ secured: true })
    @Roles([ROLE.ADMIN])
    async getById(@ProcessId() processId: string, @Param('id') id: string, @Query('specify_time') specifyTime: string) {
        const rs = await firstValueFrom(this.shiftInDayClient.send<ShiftInDayTcpByIdResponse, { id: string, specify_time: string }>(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_IN_DAY_BY_ID, { data: { id, specify_time: specifyTime }, processId }).pipe(map(row => row.data)));
        return new ResponseDto<ShiftInDayTcpByIdResponse>({ data: rs })
    }


    @Get('shift/:id')
    @ApiOperation({ summary: 'Api này chỉ để lấy thông tin ca' })
    async getByIdShft(@ProcessId() processId: string, @Param('id') id: string) {
        const rs = await firstValueFrom(this.shiftInDayClient.send<ShiftInWeekInterface, { id: string }>(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_IN_DAY_BY_ID_REAL, { data: { id }, processId }).pipe(map(row => row.data)));
        console.log(rs);

        return new ResponseDto({ data: rs })
    }

}