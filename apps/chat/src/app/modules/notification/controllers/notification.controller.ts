import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { TCP_CHAT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { NotificationService } from '../services/notification.service';

@Controller()
export class NotificationController {
    constructor(private readonly service: NotificationService) {}
    @EventPattern(TCP_CHAT_SERVICE_MESSAGE.CREATE_NOTIFICATION) create(@RequestParams() data: any) { return this.service.create(data); }
    @MessagePattern(TCP_CHAT_SERVICE_MESSAGE.GET_NOTIFICATIONS) async find(@RequestParams() data: any) { return ResponseTcp.success(await this.service.find(data.userId, data.roleName, data.page, data.limit, data.unreadOnly)); }
    @MessagePattern(TCP_CHAT_SERVICE_MESSAGE.GET_NOTIFICATION_UNREAD_COUNT) async unread(@RequestParams() data: any) { return ResponseTcp.success({ unreadCount: await this.service.unread(data.userId, data.roleName) }); }
    @MessagePattern(TCP_CHAT_SERVICE_MESSAGE.MARK_NOTIFICATION_READ) async read(@RequestParams() data: any) { return ResponseTcp.success(await this.service.markRead(data.id, data.userId, data.roleName)); }
    @MessagePattern(TCP_CHAT_SERVICE_MESSAGE.MARK_ALL_NOTIFICATIONS_READ) async readAll(@RequestParams() data: any) { return ResponseTcp.success(await this.service.markAll(data.userId, data.roleName)); }
}
