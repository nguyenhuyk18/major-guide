import { Controller, UseInterceptors } from "@nestjs/common";
import { ProvinceService } from "../services/province.service";
import { MessagePattern } from "@nestjs/microservices";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { ProvinceResponseTcp } from '@common/interfaces/tcp/province';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptors';


@Controller('province')
@UseInterceptors(TcpLoggingInterceptor)
export class ProvinceController {
    constructor(private readonly provinceService: ProvinceService) { }


    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_ALL_PROVINCE)
    async getAllProvince() {
        const rs = await this.provinceService.getAll();
        return ResponseTcp.success<ProvinceResponseTcp[]>(rs)
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_PROVINCE_BY_ID)
    async getByIdProvince(@RequestParams() param: string) {
        const rs = await this.provinceService.getById(param);
        return ResponseTcp.success<ProvinceResponseTcp>(rs)
    }

}