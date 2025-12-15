import { Controller, Inject, UseInterceptors } from "@nestjs/common";
import { AuthorizerService } from "../services/authorizer.service";
import { MessagePattern } from "@nestjs/microservices";
import { TCP_AUTHORIZER_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { CreateKeyCloakUserRequest } from "@common/interfaces/common/create-user-keyloak-request.interface";
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptors';


@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class AuthorizerController {
    constructor(private readonly authorizerService: AuthorizerService

    ) { }



    @MessagePattern(TCP_AUTHORIZER_SERVICE_MESSAGE.CREATE_USER)
    async register(@RequestParams() param: CreateKeyCloakUserRequest) {
        await this.authorizerService.createUser(param);
        return ResponseTcp.success<string>('Đăng ký tài khoản thành công')
    }


}