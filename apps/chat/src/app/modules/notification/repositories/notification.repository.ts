import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationModel, NotificationModelName } from '@common/schemas/chat/notification.schema';

@Injectable()
export class NotificationRepository {
    constructor(@InjectModel(NotificationModelName) private readonly model: NotificationModel) {}
    async createIdempotent(data: Partial<Notification>) {
        const old = await this.model.findOne({ eventId: data.eventId }).lean().exec();
        if (old) return { notification: old, created: false };
        try { return { notification: await this.model.create(data), created: true }; }
        catch (e: any) { if (e?.code === 11000) return { notification: await this.model.findOne({ eventId: data.eventId }).lean().exec(), created: false }; throw e; }
    }
    findForUser(userId: string, roleName: string, page: number, limit: number, unreadOnly: boolean) {
        const access: any = { $or: [{ recipientId: userId }, { recipientRole: roleName }] };
        const filter: any = unreadOnly ? { $and: [access, { $or: [{ recipientId: userId, isRead: false }, { recipientRole: roleName, readBy: { $ne: userId } }] }] } : access;
        return Promise.all([this.model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(), this.model.countDocuments(filter).exec()]);
    }
    countUnread(userId: string, roleName: string) { return this.model.countDocuments({ $or: [{ recipientId: userId, isRead: false }, { recipientRole: roleName, readBy: { $ne: userId } }] }).exec(); }
    markRead(id: string, userId: string, roleName: string) { return this.model.findOneAndUpdate({ _id: id, $or: [{ recipientId: userId }, { recipientRole: roleName }] }, roleName === 'admin' ? { $addToSet: { readBy: userId } } : { isRead: true, readAt: new Date() }, { new: true }).lean().exec(); }
    async markAllRead(userId: string, roleName: string) { await Promise.all([this.model.updateMany({ recipientId: userId, isRead: false }, { isRead: true, readAt: new Date() }), this.model.updateMany({ recipientRole: roleName, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } })]); }
}
