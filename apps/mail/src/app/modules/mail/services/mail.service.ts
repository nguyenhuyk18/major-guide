import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { SendMailOptions } from '@common/interfaces/common/mail-sender.interface';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: configService.get<string>('MAIL_CONFIG.HOST'),
            port: configService.get<number>('MAIL_CONFIG.PORT'),
            secure: false,
            auth: {
                user: configService.get<string>('MAIL_CONFIG.USER'),
                pass: configService.get<string>('MAIL_CONFIG.PASS'),
            },
        })
    }


    async sendEmail({ to, subject, html, text, senderName, senderEmail, attachments }: SendMailOptions) {
        const sendername: string = this.configService.get<string>('MAIL_CONFIG.SENDER_NAME')
        const sendermail: string = this.configService.get<string>('MAIL_CONFIG.SENDER_EMAIL')

        const mailOptions = {
            from: `"${senderName ?? sendername}" <${senderEmail ?? sendermail}>`,
            to,
            subject,
            html,
            text: text ?? html.replace(/<[^>]+>/g, ''),
            attachments,
        };

        try {
            await this.transporter.sendMail(mailOptions)
            this.logger.log(`📧 Mail sent to ${to}`);
        } catch (error) {
            this.logger.error(`❌ Failed to send mail to ${to}:`, error);
            throw error;
        }


    }
}