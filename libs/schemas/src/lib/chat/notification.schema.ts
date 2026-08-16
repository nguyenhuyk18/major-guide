import { Prop, Schema } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';

@Schema({ collection: 'notifications' })
export class Notification extends Base {
    @Prop({ type: String, index: true }) recipientId?: string;
    @Prop({ type: String, index: true }) recipientRole?: string;
    @Prop({ type: String, required: true }) type: string;
    @Prop({ type: String, required: true }) title: string;
    @Prop({ type: String, required: true }) message: string;
    @Prop({ type: String, required: true }) entityType: string;
    @Prop({ type: String, required: true }) entityId: string;
    @Prop({ type: String, required: true }) actionUrl: string;
    @Prop({ type: String }) actorId?: string;
    @Prop({ type: String }) actorName?: string;
    @Prop({ type: String }) actorAvatar?: string;
    @Prop({ type: Object, default: {} }) metadata?: Record<string, unknown>;
    @Prop({ type: Boolean, default: false }) isRead: boolean;
    @Prop({ type: Date, default: null }) readAt?: Date;
    @Prop({ type: [String], default: [] }) readBy: string[];
    @Prop({ type: String, required: true, unique: true, index: true }) eventId: string;
}

export const NotificationSchema = createSchema(Notification);
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientRole: 1, createdAt: -1 });
export const NotificationModelName = Notification.name;
export const NotificationDestination = { name: NotificationModelName, schema: NotificationSchema };
export type NotificationModel = Model<Notification>;
