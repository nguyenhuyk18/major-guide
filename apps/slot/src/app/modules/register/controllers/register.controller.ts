import { TCP_SLOT_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { BadRequestException, Controller, UseInterceptors } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { RegisterService } from "../services/register.service";
import { RequestParams } from "@common/decorators/request-params.decorator";
import { RegisterTcpRequest, RegisterTcpResponse } from '@common/interfaces/tcp/register';
import { ResponseTcp } from "@common/interfaces/tcp/common/response-tcp.interface";
import { TcpLoggingInterceptor } from "@common/interceptors/tcpLogging.interceptors";
import { UserInfo } from '../../../../../../../libs/decorators/src/lib/get-user.decorator';
import { User } from "@common/schemas/user-access/user.schema";


@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class RegisterController {
    constructor(private readonly registerService: RegisterService) { }

    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.CREATE_REGISTER_EXPERT)
    async create(@RequestParams() param: RegisterTcpRequest) {

        const rs = await this.registerService.create(param)
        return ResponseTcp.success<RegisterTcpResponse>(rs)
    }


    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.GET_REGISTER_BY_ID_EXPERT)
    async findRegisterByIdExpert(@RequestParams() param: string) {
        const rs = await this.registerService.getByIdExpert(param);

        if (!rs) {
            throw new BadRequestException(`Không tìm thấy đơn đăng ký của chuyên gia mang mã ${param}`)
        }

        return ResponseTcp.success<RegisterTcpResponse>(rs);
    }
}