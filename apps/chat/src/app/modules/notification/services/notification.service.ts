import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
    constructor(private readonly repo: NotificationRepository, private readonly gateway: NotificationGateway) {}
    async create(data: any) { const result = await this.repo.createIdempotent(data); if (result.created) this.gateway.publish(result.notification); return result.notification; }
    async find(userId: string, roleName: string, page = 1, limit = 20, unreadOnly = false) { const [result, total] = await this.repo.findForUser(userId, roleName, page, limit, unreadOnly); return { result, total, totalPage: Math.ceil(total / limit), unreadCount: await this.repo.countUnread(userId, roleName) }; }
    unread(userId: string, roleName: string) { return this.repo.countUnread(userId, roleName); }
    markRead(id: string, userId: string, roleName: string) { return this.repo.markRead(id, userId, roleName); }
    async markAll(userId: string, roleName: string) { await this.repo.markAllRead(userId, roleName); return { success: true }; }
}
