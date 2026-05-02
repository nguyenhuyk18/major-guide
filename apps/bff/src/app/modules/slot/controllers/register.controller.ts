import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Body, Controller, Get, Inject, Param, Post, Put, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { RegisterRequestDto } from '@common/interfaces/gateway/register/register-request.interface';
import { RegisterResponseDto } from '@common/interfaces/gateway/register/register-response.interface';
import { ResponseDto } from "@common/interfaces/gateway/response-gateway.dto";
import { TCP_SLOT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { ProcessId } from "@common/decorators/processid.decorator";
import { firstValueFrom, map } from "rxjs";
import { UserInfo } from '@common/decorators/get-user.decorator';
import { User } from "@common/schemas/user-access/user.schema";
import { Authorization } from "@common/decorators/authorizer.decorator";
import { Register } from "@common/schemas/slot/register.schema";
// import { STATUS_REGISTER_ADVISE } from "@common/constant/enum/status-register-advise.constant";
import { PaginationResponse } from '@common/interfaces/tcp/common/pagegination-tcp.interface';
import { Roles } from "@common/decorators/role.decorator";
import { ROLE } from "@common/constant/enum/action.constant";
import { getCurrentWeek } from "@common/utils/common/convert-time.util";

@Controller('register')
@ApiTags('Register')
export class RegisterController {
    constructor(@Inject(TCP_SERVICE.SLOT_SERVICE) private registerClient: TcpClient) { }


    // đăng ký lịch tư vấn của chuyên gia
    @Post()
    @Authorization({ secured: true })
    @ApiOkResponse({ type: ResponseDto<RegisterResponseDto> })
    @ApiOperation({ summary: 'Tạo đơn đăng ký !!!' })
    @Authorization({ secured: true })
    @Roles([ROLE.ADMIN, ROLE.EXPERT])
    async createRegister(@ProcessId() processId: string, @Body() body: RegisterRequestDto, @UserInfo() userInfo: User) {
        body.id_expert = userInfo.id;

        const rs = await firstValueFrom(this.registerClient.send<RegisterResponseDto, RegisterRequestDto>(TCP_SLOT_SERVICE_MESSAGE.CREATE_REGISTER_EXPERT, { processId: processId, data: body }).pipe(map(row => new ResponseDto({ data: row.data }))));

        return rs;
    }


    // chấp thuận lịch đăng ký của chuyên gia
    @Put('/accept-register/:id')
    @Authorization({ secured: true })
    @ApiOkResponse({ type: ResponseDto<string> })
    @ApiOperation({ summary: 'Chấp nhận đơn đăng ký lịch mới của chuyên gia' })
    @Roles([ROLE.ADMIN])
    async updateRegister(@ProcessId() processId: string, @Param('id') id: string) {

        const rs = await firstValueFrom(this.registerClient.send<string, { id: string }>(TCP_SLOT_SERVICE_MESSAGE.APPROVE_THE_REGISTER, { processId, data: { id } }).pipe(map(row => new ResponseDto<string>({ data: row.data }))))

        return rs;
    }


    // Hủy lịch đăng ký của chuyên gia
    @Put('/cancle-register/:id')
    @Authorization({ secured: true })
    @ApiOkResponse({ type: ResponseDto<string> })
    @ApiOperation({ summary: 'Hủy đơn đăng ký của chuyên gia' })
    @Roles([ROLE.ADMIN])
    async disapproveRegister(@ProcessId() processId: string, @Param('id') id: string) {

        const rs = await firstValueFrom(this.registerClient.send<string, { id: string }>(TCP_SLOT_SERVICE_MESSAGE.CANCLE_THE_REGISTER, { processId, data: { id } }).pipe(map(row => new ResponseDto<string>({ data: row.data }))))

        return rs;
    }


    // lấy tất cả các đơn đăng ký trong DB 
    @Get()
    @ApiOkResponse({ type: ResponseDto<(Register & Partial<User>)[]> })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiOperation({ summary: 'Api lấy toàn bộ đơn đăng ký (có phân trang)' })
    @Authorization({ secured: true })
    @Roles([ROLE.ADMIN])
    async getAllRegister(@ProcessId() processId: string, @Query('page') page?: number, @Query('status') status?: string) {
        const pageSend = page || 1;
        const statusSend = status || '';

        const rs = await firstValueFrom(this.registerClient.send<PaginationResponse<Register & Partial<User>>, { pageSend: number, statusSend: string }>(TCP_SLOT_SERVICE_MESSAGE.GET_ALL_REGISTER, { processId, data: { pageSend, statusSend } }).pipe(map(row => row.data)));

        return new ResponseDto<PaginationResponse<Register & Partial<User>>>({ data: rs });
    }


    // lấy đơn đăng ký theo mã chuyên gia đó
    @Get('/expert/:id_expert')
    @ApiOkResponse({ type: ResponseDto<RegisterResponseDto> })
    @ApiQuery({ name: 'start_time', required: false, type: String })
    @ApiQuery({ name: 'end_time', required: false, type: String })
    @ApiOperation({ summary: 'Lấy đơn đăng ký theo mã chuyên gia !!!' })
    // @Roles([ ROLE.ADMIN , ROLE.EXPERT ])
    async findRegisterByIdExpert(@ProcessId() processId: string, @Param('id_expert') id: string, @Query('start_time') startTime?: string,
        @Query('end_time') endTime?: string) {
        const tmp = getCurrentWeek();

        let start = tmp[0];
        let end = tmp[tmp.length - 1];

        if (startTime && endTime) {
            start = new Date(startTime);
            end = new Date(endTime);
        }

        const rs = await firstValueFrom(
            this.registerClient.send<RegisterResponseDto, { data: string, startTime: Date, endTime: Date }>(TCP_SLOT_SERVICE_MESSAGE.GET_REGISTER_BY_ID_EXPERT, { processId, data: { data: id, endTime: end, startTime: start } }).pipe(map(row => new ResponseDto({ data: row.data })))
        )
        return rs;
    }


    // lấy đơn đăng ký theo ID 
    @Get(':id')
    @ApiOkResponse({ type: ResponseDto<RegisterResponseDto> })
    @ApiOperation({ summary: 'Lấy đơn đăng ký theo mã id!!!' })
    // @Roles([ ROLE.ADMIN , ROLE.EXPERT ])
    async findRegisterById(@Param('id') id: string, @ProcessId() processId: string) {

        const rs = await firstValueFrom(this.registerClient.send<Register, { id: string }>(TCP_SLOT_SERVICE_MESSAGE.GET_REGISTER_BY_ID, { processId, data: { id } }).pipe(map(row => row.data)));

        return new ResponseDto<Register>({ data: rs });
    }

}