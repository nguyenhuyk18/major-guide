import { Controller, UseInterceptors } from "@nestjs/common";
import { AuthorizerService } from "../services/authorizer.service";
import { GrpcMethod, MessagePattern } from "@nestjs/microservices";
import { TCP_AUTHORIZER_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { CreateKeyCloakUserRequest } from "@common/interfaces/common/create-user-keyloak-request.interface";
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptors';
import { ProcessId } from '@common/decorators/processid.decorator';
import { UserResponseTcp } from "@common/interfaces/tcp/user";
import { LoginTcpRequest } from "@common/interfaces/tcp/authorizer";
import { ExchangeUserTokenResponse } from "@common/interfaces/common/exchange-token-user-password.interface";
import { GRPC_MESSAGE_AUTHORIZER } from '@common/constant/enum/grpc-message-pattern.constant';
import { AuthorizerResponse } from "@common/interfaces/gateway/authorizer";
import { VerifyTokenRequest } from '@common/interfaces/grpc/authorizer';
import { User } from "@common/schemas/user-access/user.schema";


@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class AuthorizerController {
    constructor(
        private readonly authorizerService: AuthorizerService

    ) { }



    @MessagePattern(TCP_AUTHORIZER_SERVICE_MESSAGE.CREATE_USER)
    async register(@RequestParams() param: CreateKeyCloakUserRequest, @ProcessId() processId: string) {
        // console.log(TCP_AUTHORIZER_SERVICE_MESSAGE.CREATE_USER, 'sduidyfaiwyuegfyuiaerghyulervbghyuole')
        const rs = await this.authorizerService.createUser(param, processId);
        return ResponseTcp.success<UserResponseTcp>(rs)
    }



    @MessagePattern(TCP_AUTHORIZER_SERVICE_MESSAGE.LOGIN_USER)
    async login(@RequestParams() param: LoginTcpRequest) {
        // console.log(param, 'dfdf');
        const rs = await this.authorizerService.loginUser(param);
        return ResponseTcp.success<ExchangeUserTokenResponse & Partial<User>>(rs);
    }


    @GrpcMethod(GRPC_MESSAGE_AUTHORIZER.VERIFY_TOKEN_USER.service_name, GRPC_MESSAGE_AUTHORIZER.VERIFY_TOKEN_USER.method)
    async verifyTokenUser(param: VerifyTokenRequest): Promise<AuthorizerResponse> {
        const rs = await this.authorizerService.verifyUserToken(param.token, param.processId);
        return rs;
    }

}