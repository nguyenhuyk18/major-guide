import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TCP_AUTHORIZER_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
import { CreateKeyCloakUserRequest } from "@common/interfaces/common/create-user-keyloak-request.interface";
import { ExchangeUserTokenResponse } from "@common/interfaces/common/exchange-token-user-password.interface";
import { LoginRequestDto } from "@common/interfaces/gateway/authorizer";
import { ResponseDto } from "@common/interfaces/gateway/response-gateway.dto";
import { LoginTcpRequest } from "@common/interfaces/tcp/authorizer";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { UserResponseTcp } from "@common/interfaces/tcp/user";
import { User } from "@common/schemas/user-access/user.schema";
import { Body, Controller, Inject, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { firstValueFrom, map } from "rxjs";

@Controller('authorizer')
export class AuthorizerController {
    constructor(@Inject(TCP_SERVICE.AUTHORIZER_SERVICE) private readonly authorizerService: TcpClient) {

    }

    @Post()
    @ApiOkResponse({ type: ResponseDto<User> })
    @ApiOperation({ summary: 'Đăng ký tài khoản người dùng !!!' })
    async create(@Body() data: CreateKeyCloakUserRequest, @ProcessId() processId: string) {
        const rs = await firstValueFrom(this.authorizerService.send<UserResponseTcp, CreateKeyCloakUserRequest>(TCP_AUTHORIZER_SERVICE_MESSAGE.CREATE_USER, { processId, data: data }).pipe(map(row => row.data)))
        return new ResponseDto<UserResponseTcp>({ data: rs });
    }


    @Post('login')
    @ApiOkResponse({ type: ResponseDto<ExchangeUserTokenResponse> })
    @ApiOperation({ summary: 'Đăng nhập lấy quyền truy cập token' })
    async loginUser(@Body() data: LoginRequestDto, @ProcessId() processId: string) {
        const rs = await firstValueFrom(this.authorizerService.send<ExchangeUserTokenResponse, LoginTcpRequest>(TCP_AUTHORIZER_SERVICE_MESSAGE.LOGIN_USER, { processId, data }).pipe(map(row => row.data)))
        return new ResponseDto<ExchangeUserTokenResponse>({ data: rs })
    }
}