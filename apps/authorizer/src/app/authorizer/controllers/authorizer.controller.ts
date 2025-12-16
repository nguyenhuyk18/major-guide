import { Controller, Inject, UseInterceptors } from "@nestjs/common";
import { AuthorizerService } from "../services/authorizer.service";
import { MessagePattern } from "@nestjs/microservices";
import { TCP_AUTHORIZER_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { CreateKeyCloakUserRequest } from "@common/interfaces/common/create-user-keyloak-request.interface";
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptors';
import { ProcessId } from '@common/decorators/processid.decorator';
import { UserResponseTcp } from "@common/interfaces/tcp/user";
import { LoginTcpRequest } from "@common/interfaces/tcp/authorizer";
import { ExchangeUserTokenResponse } from "@common/interfaces/common/exchange-token-user-password.interface";


@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class AuthorizerController {
    constructor(private readonly authorizerService: AuthorizerService

    ) { }



    @MessagePattern(TCP_AUTHORIZER_SERVICE_MESSAGE.CREATE_USER)
    async register(@RequestParams() param: CreateKeyCloakUserRequest, @ProcessId() processId: string) {
        // console.log(TCP_AUTHORIZER_SERVICE_MESSAGE.CREATE_USER, 'sduidyfaiwyuegfyuiaerghyulervbghyuole')
        const rs = await this.authorizerService.createUser(param, processId);
        return ResponseTcp.success<UserResponseTcp>(rs)
    }



    @MessagePattern(TCP_AUTHORIZER_SERVICE_MESSAGE.LOGIN_USER)
    async login(@RequestParams() param: LoginTcpRequest) {
        const rs = await this.authorizerService.loginUser(param);
        return ResponseTcp.success<ExchangeUserTokenResponse>(rs);
    }


    @MessagePattern(TCP_AUTHORIZER_SERVICE_MESSAGE.VERIFY_USER)
    async verifyTokenUser(@RequestParams() param: string, @ProcessId() processId: string) {
        console.log(param)
        const rs = await this.authorizerService.verifyUserToken(param, processId);
        return ResponseTcp.success(rs);
    }

}