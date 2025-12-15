import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { RequestParams } from "@common/decorators/request-params.decorator";
import { Controller, UseInterceptors } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { WardService } from "../services/ward.service";
import { ResponseTcp } from "@common/interfaces/tcp/common/response-tcp.interface";
import { WardResponseTcp } from '@common/interfaces/tcp/ward/ward-response.interface';
import { TcpLoggingInterceptor } from "@common/interceptors/tcpLogging.interceptors";

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class WardController {

    constructor(private readonly wardService: WardService) { }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_ALL_WARD)
    async getAllWard() {
        // console.log('sdsdsdsdsdsdsd')
        const rs = await this.wardService.getAll();
        return ResponseTcp.success<WardResponseTcp[]>(rs)
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_WARD_BY_ID)
    async getWardById(@RequestParams() param: string) {
        const rs = await this.wardService.getById(param);
        return ResponseTcp.success<WardResponseTcp>(rs);
    }


}