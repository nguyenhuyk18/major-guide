import { Controller } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { MessagePattern } from "@nestjs/microservices";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { RequestParams } from "@common/decorators/request-params.decorator";
import { UserRequestTcp } from '@common/interfaces/tcp/user';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { User } from "@common/schemas/user-access/user.schema";
import { ProcessId } from '@common/decorators/processid.decorator'

@Controller()
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


}