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

@Controller('shift-in-day')
@ApiTags('Shift In Day')
export class ShiftInDayController {
    constructor(@Inject(TCP_SERVICE.SLOT_SERVICE) private shiftInDayClient: TcpClient) { }

    @Get()
    @ApiOkResponse({ type: ResponseDto<ShiftInDayAmount[]> })
    // Thêm required: false vào đây
    @ApiQuery({ name: 'start_time', required: false, type: String })
    @ApiQuery({ name: 'end_time', required: false, type: String })
    @ApiOperation({ summary: 'Api này để xem được các ca trong 1 ngày nhắm giúp dễ truy vấn số chuyên gia trong ca đấy' })
    async getAll(@ProcessId() processId: string, @Query('start_time') startTime?: string, @Query('end_time') endTime?: string) {
        const tmp = getCurrentWeek();

        let start = tmp[0];
        let end = tmp[1];

        if (startTime && endTime) {
            start = new Date(startTime);
            end = new Date(endTime);
        }

        const rs = await firstValueFrom(this.shiftInDayClient.send<ShiftInDayAmount[], { endTime: Date, startTime: Date }>(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_IN_DAY, { data: { endTime: end, startTime: start }, processId }).pipe(map(row => row.data)));


        return new ResponseDto<ShiftInDayAmount[]>({ data: rs })
    }


    @Get(':id')
    @ApiOkResponse({ type: ResponseDto<ShiftInDayTcpByIdResponse> })
    @ApiOperation({ summary: 'Api này để xem các chuyên gia có trong ca đó' })
    async getById(@ProcessId() processId: string, @Param('id') id: string, @Query('specify_time') specifyTime: string) {
        const rs = await firstValueFrom(this.shiftInDayClient.send<ShiftInDayTcpByIdResponse, { id: string, specify_time: string }>(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_IN_DAY_BY_ID, { data: { id, specify_time: specifyTime }, processId }).pipe(map(row => row.data)));
        return new ResponseDto<ShiftInDayTcpByIdResponse>({ data: rs })
    }


    // @Get('')

}