import { Controller, Get, Inject, Param } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { WardResponseDto } from '@common/interfaces/gateway/ward';
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { ProcessId } from "@common/decorators/processid.decorator";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { firstValueFrom, map } from "rxjs";

@Controller('ward')
@ApiTags('Ward')
export class WardController {
    constructor(@Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly wardClient: TcpClient) { }
    @Get()
    @ApiOkResponse({ type: ResponseDto<WardResponseDto> })
    async getAll(@ProcessId() processId: string) {
        // console.log('chó rách')
        const rs = await firstValueFrom(this.wardClient.send<WardResponseDto, string>(
            TCP_USER_ACCESS_SERVICE_MESSAGE.GET_ALL_WARD, { processId: processId }
        ).pipe(map(row => new ResponseDto({ processID: processId, data: row.data }))))

        return rs;
    }


    @Get(':id_ward')
    @ApiOkResponse({ type: ResponseDto<WardResponseDto> })
    async getById(@ProcessId() processId: string, @Param('id_ward') id: string) {
        const rs = await firstValueFrom(this.wardClient.send<WardResponseDto, string>(
            TCP_USER_ACCESS_SERVICE_MESSAGE.GET_WARD_BY_ID, { processId: processId, data: id }
        ).pipe(map(row => new ResponseDto({ processID: processId, data: row.data }))))

        return rs;
    }
}