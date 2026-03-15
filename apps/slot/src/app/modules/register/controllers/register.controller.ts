import { TCP_SLOT_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { BadRequestException, Controller, UseInterceptors } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { RegisterService } from "../services/register.service";
import { RequestParams } from "@common/decorators/request-params.decorator";
import { RegisterTcpRequest, RegisterTcpResponse } from '@common/interfaces/tcp/register';
import { ResponseTcp } from "@common/interfaces/tcp/common/response-tcp.interface";
import { TcpLoggingInterceptor } from "@common/interceptors/tcpLogging.interceptors";
import { Register } from "@common/schemas/slot/register.schema";
import { STATUS_REGISTER_ADVISE } from "@common/constant/enum/status-register-advise.constant";
import { ProcessId } from '@common/decorators/processid.decorator';
import { User } from "@common/schemas/user-access/user.schema";
import { PaginationResponse } from '@common/interfaces/tcp/common/pagegination-tcp.interface';


@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class RegisterController {
    constructor(private readonly registerService: RegisterService) { }

    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.GET_ALL_REGISTER)
    async getAll(@RequestParams() params: { pageSend: number, statusSend: string }, @ProcessId() processId: string): Promise<ResponseTcp<PaginationResponse<Register & Partial<User>>>> {

        const page = params.pageSend;

        // if (!Object.values(STATUS_REGISTER_ADVISE).includes(params.statusSend as STATUS_REGISTER_ADVISE)) {
        //     throw new BadRequestException('Invalid status');
        // }

        const status = params.statusSend as STATUS_REGISTER_ADVISE;
        // console.log('con chim non')
        let cond: Partial<Register> = {}
        if (status) {
            cond = {
                status: status
            }
        }

        const rs = await this.registerService.getAll(page, cond, processId);
        return ResponseTcp.success<PaginationResponse<Register & Partial<User>>>(rs)
    }


    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.CREATE_REGISTER_EXPERT)
    async create(@RequestParams() param: RegisterTcpRequest) {

        const rs = await this.registerService.create(param)
        return ResponseTcp.success<RegisterTcpResponse>(rs)
    }

    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.APPROVE_THE_REGISTER)
    async approveRegisterById(@RequestParams() param: { id: string }) {
        // console.log(param.id);
        const rs = await this.registerService.approveTheRegister(param.id);

        if (!rs) {
            return ResponseTcp.success<string>('Cập nhật trạng thái đăng ký lịch thất bại !!!!');
        }
        return ResponseTcp.failer<string>('Cập nhật trạng thái đăng ký lịch thành công !!!!');
    }


    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.CANCLE_THE_REGISTER)
    async cancleRegisterById(@RequestParams() param: { id: string }) {
        await this.registerService.update(param.id, { status: STATUS_REGISTER_ADVISE.CANCLE });

        return ResponseTcp.success<string>('Đã hủy đơn đăng ký của chuyên gia này !!!');
    }

    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.GET_REGISTER_BY_ID_EXPERT)
    async findRegisterByIdExpert(@RequestParams() param: string) {
        const rs = await this.registerService.getByIdExpert(param);

        if (!rs) {
            throw new BadRequestException(`Không tìm thấy đơn đăng ký của chuyên gia mang mã ${param}`)
        }

        return ResponseTcp.success<RegisterTcpResponse>(rs);
    }


    @MessagePattern(TCP_SLOT_SERVICE_MESSAGE.GET_REGISTER_BY_ID)
    async findRegisterById(@RequestParams() param: { id: string }) {
        const rs = await this.registerService.getById(param.id);
        return ResponseTcp.success<Register>(rs);
    }
}