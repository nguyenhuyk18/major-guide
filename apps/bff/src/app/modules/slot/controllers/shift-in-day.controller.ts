import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Controller, Get, Inject, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { firstValueFrom, map } from "rxjs";
import { ShiftInDayTcpResponse } from '@common/interfaces/tcp/shift-in-day/shift-in-day-response-tcp.interface';
import { TCP_SLOT_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
import { ResponseDto } from "@common/interfaces/gateway/response-gateway.dto";
import { ShiftInDayAmount } from '@common/interfaces/tcp/shift-in-day/shift-in-day-amount-employ-tcp.interface';

@Controller('shift-in-day')
@ApiTags('Shift In Day')
export class ShiftInDayController {
    constructor(@Inject(TCP_SERVICE.SLOT_SERVICE) private shiftInDayClient: TcpClient) { }

    @Get()
    @ApiOkResponse({ type: ResponseDto<ShiftInDayAmount[]> })
    @ApiOperation({ summary: 'Api này để xem được các ca trong 1 ngày nhắm giúp dễ truy vấn số chuyên gia trong ca đấy' })
    async getAll(@ProcessId() processId: string) {
        // console.log('con chó')
        const rs = await firstValueFrom(this.shiftInDayClient.send<ShiftInDayAmount[], string>(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_IN_DAY, { data: null, processId }).pipe(map(row => row.data)));
        return new ResponseDto<ShiftInDayAmount[]>({ data: rs })
    }



    @Get(':id')
    @ApiOkResponse({ type: ResponseDto<ShiftInDayTcpResponse> })
    @ApiOperation({ summary: 'Api này để xem được các ca trong 1 ngày nhắm giúp dễ truy vấn số chuyên gia trong ca đấy' })
    async getById(@ProcessId() processId: string, @Param('id') id: string) {

        console.log(id);
        const rs = await firstValueFrom(this.shiftInDayClient.send<ShiftInDayTcpResponse, string>(TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_IN_DAY_BY_ID, { data: id, processId }).pipe(map(row => row.data)));
        return new ResponseDto<ShiftInDayTcpResponse>({ data: rs })
    }


    // @Get('')
}