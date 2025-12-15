import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { ResponseDto } from "@common/interfaces/gateway/response-gateway.dto";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Controller, Get, Inject, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProvinceResponseDto } from '@common/interfaces/gateway/province'
import { ProcessId } from "@common/decorators/processid.decorator";
import { firstValueFrom, map } from "rxjs";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";

@Controller('province')
@ApiTags('Province')
export class ProvinceController {
    constructor(@Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly provinceClient: TcpClient) { }

    @Get()
    @ApiOperation({ summary: 'Lấy toàn bộ các tỉnh thành !!!' })
    @ApiOkResponse({ type: ResponseDto<ProvinceResponseDto> })
    async getAll(@ProcessId() processId: string) {
        // console.log('sdadasd')
        const rs = await firstValueFrom(this.provinceClient.send<ProvinceResponseDto, string>(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_ALL_PROVINCE, { processId: processId }).pipe(map(row => new ResponseDto({ data: row.data, processID: processId }))))
        return rs;
    }

    @Get(':id_province')
    @ApiOperation({ summary: 'Lấy tỉnh thành theo ID !!!' })
    @ApiOkResponse({ type: ResponseDto<ProvinceResponseDto> })
    async getById(@ProcessId() processId: string, @Param('id_province') id: string) {
        const rs = await firstValueFrom(
            this.provinceClient.send<ProvinceResponseDto, string>(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_PROVINCE_BY_ID, { processId, data: id }).pipe(map(row => new ResponseDto({ data: row.data, processID: processId })))
        )
        return rs;
    }

}