import { Controller, UseInterceptors } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { MessagePattern } from "@nestjs/microservices";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { RequestParams } from "@common/decorators/request-params.decorator";
import { UpdateAvatarRequestTcp, UserRequestTcp } from '@common/interfaces/tcp/user';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { User } from "@common/schemas/user-access/user.schema";
import { ProcessId } from '@common/decorators/processid.decorator'
import { TcpLoggingInterceptor } from "@common/interceptors/tcpLogging.interceptors";

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class UserController {
    constructor(private readonly userService: UserService) { }


    // @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_NEW_USER)
    // async create(@RequestParams() param: (UserRequestTcp & { buff: string, fileName: string }), @ProcessId() processId: string) {
    //     // console.log('ÁDASFSDGSDGDGSDGERGWERTG')
    //     const rs = await this.userService.createUser(param, processId);
    //     return ResponseTcp.success<User>(rs)
    // }


    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_NEW_USER)
    async create(@RequestParams() param: UserRequestTcp, @ProcessId() processId: string) {
        // console.log('ÁDASFSDGSDGDGSDGERGWERTG')
        const rs = await this.userService.createUser(param, processId);
        return ResponseTcp.success<User>(rs)
    }


    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_USER_BY_ID)
    async getById(@RequestParams() param: string) {
        // console.log('ÁDASFSDGSDGDGSDGERGWERTG')
        const rs = await this.userService.getByIdUser(param);
        return ResponseTcp.success<User>(rs)
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_AVATAR_USER)
    async updateAvatar(@RequestParams() param: UpdateAvatarRequestTcp, @ProcessId() processId: string) {
        await this.userService.updateAvatar(param, processId)
        return ResponseTcp.success<string>('Thêm ảnh thành công !!')
    }
}