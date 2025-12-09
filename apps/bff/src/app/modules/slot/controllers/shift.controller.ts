import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { Controller, Get, Inject, Param, UseInterceptors } from "@nestjs/common";
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { TCP_SLOT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { firstValueFrom, map } from "rxjs";
import { ShiftResponseTcp } from '@common/interfaces/tcp/shift/shift-response-tcp.interface';
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptors';
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Shift } from "@common/schemas/slot/shift.schema";
import { ResponseTcp } from "@common/interfaces/tcp/common/response-tcp.interface";
import { ProcessId } from '@common/decorators/processid.decorator';

@Controller('shift')
@ApiTags('Shift')

export class ShiftController {
    constructor(@Inject(TCP_SERVICE.SLOT_SERVICE) private shiftClient: TcpClient) { }

    @Get()
    @ApiOkResponse({ type: ResponseDto<ResponseTcp<Shift[]>> })
    @ApiOperation({ summary: "In ra toàn bộ ca mỗi ngày !!" })
    async getAll(@ProcessId() processId: string) {

        const rs = await firstValueFrom(
            this.shiftClient.send<ShiftResponseTcp[], any>(TCP_SLOT_SERVICE_MESSAGE.GET_ALL_SLOT, { processId: processId }).pipe(map(row => new ResponseDto({ data: row })))
        )
        return rs;
    }


    @Get(':id')
    @ApiOkResponse({ type: ResponseDto<ResponseTcp<Shift>> })
    @ApiOperation({ summary: "In ca theo mã ca !!" })
    async getById(@Param('id') id: string, @ProcessId() processId: string) {
        const rs = await firstValueFrom(
            this.shiftClient.send<ShiftResponseTcp, string>(TCP_SLOT_SERVICE_MESSAGE.GET_SLOT_BY_ID, { processId: processId, data: id }).pipe(map(row => new ResponseDto({ data: row })))
        )
        return rs;
    }

}