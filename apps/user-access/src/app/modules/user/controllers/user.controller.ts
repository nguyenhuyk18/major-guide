import { Controller, Inject, UseInterceptors } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { GrpcMethod, MessagePattern } from "@nestjs/microservices";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { RequestParams } from "@common/decorators/request-params.decorator";
import { UpdateAvatarRequestTcp, UpdateUserRequestTcp, UserRequestTcp } from '@common/interfaces/tcp/user';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { User } from "@common/schemas/user-access/user.schema";
import { ProcessId } from '@common/decorators/processid.decorator'
import { TcpLoggingInterceptor } from "@common/interceptors/tcpLogging.interceptors";
import { GRPC_MESSAGE_USER_ACCESS } from '@common/constant/enum/grpc-message-pattern.constant';
import { ROLE } from "@common/constant/enum/action.constant";
import { PaginationResponse } from '@common/interfaces/gateway/common/pagegination-gateway.interface';
import { StatusAccount } from "@common/constant/enum/status-account.constant";
import { FindUserByIds } from '@common/interfaces/gateway/user';
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { RABBIT_SERVICE } from "@common/configuration/rabbit.config";
import { ContactMailRequest } from '@common/interfaces/tcp/mail';
import { MAIL_SERVICE_RABBIT_MESSAGE } from '@common/constant/enum/rabbitmq-message.constant';

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class UserController {
    constructor(private readonly userService: UserService,
        @Inject(RABBIT_SERVICE.MAIL_SERVICE) private readonly mailService: TcpClient,
        // private readonly  userService : UserService

    ) { }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_STATUS_ACCOUNT)
    async updatestatusacc(@RequestParams() params: { id_user: string, status: StatusAccount }) {
        const rs = await this.userService.updateStatusAccount(params.id_user, params.status);
        return ResponseTcp.success<User>(rs);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.CONTACT_TO_SUPPORT)
    async contactEmail(@RequestParams() data: ContactMailRequest, @ProcessId() processId: string) {
        // console.log('sdsdsdsdsdsdsd')
        this.mailService.emit<void, ContactMailRequest>(MAIL_SERVICE_RABBIT_MESSAGE.CONTACT_MAIL, { processId, data });
        return ResponseTcp.success<{ message: string }>({ message: 'Vui lòng kiếm tra email , nếu không có vui lòng kiểm tra email rác !!!' });
    }


    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_NEW_USER)
    async create(@RequestParams() param: UserRequestTcp, @ProcessId() processId: string) {
        const rs = await this.userService.createUser(param, processId);
        return ResponseTcp.success<User>(rs)
    }


    @GrpcMethod(GRPC_MESSAGE_USER_ACCESS.GET_USER_BY_ID.service_name, GRPC_MESSAGE_USER_ACCESS.GET_USER_BY_ID.method)
    async getById(param: { idUser: string, isKeycloak: boolean }) {
        // console.log(param, ' ', param.idUser);
        if (param.isKeycloak) {
            const rs = await this.userService.getByIdUser(param.idUser);
            // console.log(rs);
            return { id: rs.id, email: rs.email, fileAvartarUrl: rs.fileAvartarUrl, name: rs.name, roleName: rs.roleName, wardId: rs.wardId }
        }
        else {
            const rs = await this.userService.getById(param.idUser);
            return { id: rs.id, email: rs.email, fileAvartarUrl: rs.fileAvartarUrl, name: rs.name, roleName: rs.roleName, wardId: rs.wardId }
        }
    }


    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_USER_BY_ID)
    async getByIdTcp(@RequestParams() param: { id_user: string, isKeycloak: boolean }) {
        // console.log(param)
        if (param.isKeycloak) {
            const rs = await this.userService.getByIdUser(param.id_user);
            return ResponseTcp.success<User>(rs)
        }
        else {
            const rs = await this.userService.getById(param.id_user);
            return ResponseTcp.success<User>(rs)
        }
        // console.log(rs);

    }


    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_USER_BY_IDS)
    async getByIds(@RequestParams() param: FindUserByIds) {
        // console.log('sdsdsdsds')
        const rs = await this.userService.getByIds(param.ids);
        return ResponseTcp.success<{ [k: string]: User }>(rs);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_AVATAR_USER)
    async updateAvatar(@RequestParams() param: UpdateAvatarRequestTcp, @ProcessId() processId: string) {
        const rs = await this.userService.updateAvatar(param, processId)
        return ResponseTcp.success<string>(rs.fileAvartarUrl);
    }


    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_ALL_USER)
    async getAllUser(@RequestParams() param: { limit: number | undefined, page: number | undefined, role: ROLE | undefined, sort: string | undefined, status: StatusAccount | undefined, name: string | undefined }) {
        const rs = await this.userService.getAllUserPagination(param.limit, param.page, param.role, param.sort, param.status, param.name)
        // console.log(rs);
        return ResponseTcp.success<PaginationResponse<Partial<User>>>(rs);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_USER_PROFILE)
    async updateUserProfile(
        @RequestParams() param: UpdateUserRequestTcp,
        @ProcessId() processId: string
    ) {
        // console.log(param);
        const rs = await this.userService.updateUserProfile(param, processId);
        return ResponseTcp.success<User>(rs);
    }
}