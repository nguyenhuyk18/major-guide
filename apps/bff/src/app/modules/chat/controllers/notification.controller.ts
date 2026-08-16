import { Controller, Get, Inject, Param, Put, Query, UnauthorizedException } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';
import { TCP_SERVICE } from '@common/configuration/tcp.config';
import { TCP_CHAT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { UserInfo } from '@common/decorators/get-user.decorator';
import { ProcessId } from '@common/decorators/processid.decorator';
import { Roles } from '@common/decorators/role.decorator';
import { ROLE } from '@common/constant/enum/action.constant';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { User } from '@common/schemas/user-access/user.schema';

@Controller('notifications')
@Authorization({ secured: true })
@Roles([ROLE.ADMIN, ROLE.EXPERT])
export class NotificationController {
    constructor(@Inject(TCP_SERVICE.CHAT_SERVICE) private readonly chat: TcpClient) {}
    private call(pattern: string, data: any, processId: string) { return firstValueFrom(this.chat.send<any, any>(pattern, { processId, data }).pipe(map(row => new ResponseDto({ data: row.data })))); }
    private requireUser(user: User | null): User {
        if (!user?.id || !user?.roleName) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
        return user;
    }
    @Get() list(@UserInfo() currentUser: User | null, @ProcessId() pid: string, @Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string) { const user = this.requireUser(currentUser); return this.call(TCP_CHAT_SERVICE_MESSAGE.GET_NOTIFICATIONS, { userId: user.id, roleName: user.roleName, page: Number(page) || 1, limit: Number(limit) || 20, unreadOnly: status === 'unread' }, pid); }
    @Get('unread-count') count(@UserInfo() currentUser: User | null, @ProcessId() pid: string) { const user = this.requireUser(currentUser); return this.call(TCP_CHAT_SERVICE_MESSAGE.GET_NOTIFICATION_UNREAD_COUNT, { userId: user.id, roleName: user.roleName }, pid); }
    @Put('read-all') readAll(@UserInfo() currentUser: User | null, @ProcessId() pid: string) { const user = this.requireUser(currentUser); return this.call(TCP_CHAT_SERVICE_MESSAGE.MARK_ALL_NOTIFICATIONS_READ, { userId: user.id, roleName: user.roleName }, pid); }
    @Put(':id/read') read(@Param('id') id: string, @UserInfo() currentUser: User | null, @ProcessId() pid: string) { const user = this.requireUser(currentUser); return this.call(TCP_CHAT_SERVICE_MESSAGE.MARK_NOTIFICATION_READ, { id, userId: user.id, roleName: user.roleName }, pid); }
}
