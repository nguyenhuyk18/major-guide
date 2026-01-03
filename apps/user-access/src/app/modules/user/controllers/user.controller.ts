import { Controller, UseInterceptors } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { GrpcMethod, MessagePattern } from "@nestjs/microservices";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { RequestParams } from "@common/decorators/request-params.decorator";
import { UpdateAvatarRequestTcp, UserRequestTcp } from '@common/interfaces/tcp/user';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { User } from "@common/schemas/user-access/user.schema";
import { ProcessId } from '@common/decorators/processid.decorator'
import { TcpLoggingInterceptor } from "@common/interceptors/tcpLogging.interceptors";
import { GRPC_MESSAGE_USER_ACCESS } from '@common/constant/enum/grpc-message-pattern.constant';

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class UserController {
    constructor(private readonly userService: UserService) { }


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
    async getByIds(@RequestParams() param: { ids: string[] }) {
        // console.log('sdsdsdsds')
        const rs = await this.userService.getByIds(param.ids);
        return ResponseTcp.success<{ [k: string]: User }>(rs);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_AVATAR_USER)
    async updateAvatar(@RequestParams() param: UpdateAvatarRequestTcp, @ProcessId() processId: string) {
        await this.userService.updateAvatar(param, processId)
        return ResponseTcp.success<string>('Thêm ảnh thành công !!')
    }
}