import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RegisterRequestDto } from '@common/interfaces/gateway/register/register-request.interface'
import { RegisterResponseDto } from '@common/interfaces/gateway/register/register-response.interface';
import { ResponseDto } from "@common/interfaces/gateway/response-gateway.dto";
import { TCP_SLOT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { ProcessId } from "@common/decorators/processid.decorator";
import { firstValueFrom, map } from "rxjs";
import { UserInfo } from '@common/decorators/get-user.decorator';
import { User } from "@common/schemas/user-access/user.schema";
import { Authorization } from "@common/decorators/authorizer.decorator";

@Controller('register')
@ApiTags('Register')
export class RegisterController {
    constructor(@Inject(TCP_SERVICE.SLOT_SERVICE) private registerClient: TcpClient) { }

    @Post()
    @Authorization({ secured: true })
    @ApiOkResponse({ type: ResponseDto<RegisterResponseDto> })
    @ApiOperation({ summary: 'Tạo đơn đăng ký !!!' })
    async createRegister(@ProcessId() processId: string, @Body() body: RegisterRequestDto, @UserInfo() userInfo: User) {
        body.id_expert = userInfo.id;

        const rs = await firstValueFrom(this.registerClient.send<RegisterResponseDto, RegisterRequestDto>(TCP_SLOT_SERVICE_MESSAGE.CREATE_REGISTER_EXPERT, { processId: processId, data: body }).pipe(map(row => new ResponseDto({ data: row.data }))));

        return rs;
    }





    @Get(':id_expert')
    @ApiOkResponse({ type: ResponseDto<RegisterResponseDto> })
    @ApiOperation({ summary: 'Lấy đơn đăng ký theo mã chuyên gia !!!' })
    async findRegisterByIdExpert(@ProcessId() processId: string, @Param('id_expert') id: string) {
        const rs = await firstValueFrom(
            this.registerClient.send<RegisterResponseDto, string>(TCP_SLOT_SERVICE_MESSAGE.GET_REGISTER_BY_ID_EXPERT, { processId, data: id }).pipe(map(row => new ResponseDto({ data: row.data })))
        )
        return rs;
    }
}