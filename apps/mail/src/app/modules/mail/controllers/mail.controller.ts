import { Controller } from "@nestjs/common";
import { MailService } from "../services/mail.service";
import { MAIL_SERVICE_RABBIT_MESSAGE } from '@common/constant/enum/rabbitmq-message.constant';
import { Ctx, EventPattern, RmqContext } from '@nestjs/microservices'
import { ContactMailRequest } from '@common/interfaces/tcp/mail';
import { Logger } from '@nestjs/common';
import { RequestParams } from '@common/decorators/request-params.decorator';

@Controller()
export class MailController {
    private readonly logger = new Logger(MailController.name);

    constructor(private readonly mailService: MailService) { }


    @EventPattern(MAIL_SERVICE_RABBIT_MESSAGE.CONTACT_MAIL)
    async sendEmailContact(@RequestParams() data: ContactMailRequest, @Ctx() context: RmqContext) {
        try {
            this.logger.log(`📧 Received contact mail request: ${JSON.stringify(data)}`);

            // HTML template for the contact email
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Thông tin liên hệ mới</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f4f4f4;
                        }
                        .container {
                            background-color: #ffffff;
                            padding: 30px;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                        .header {
                            border-bottom: 3px solid #007bff;
                            padding-bottom: 15px;
                            margin-bottom: 20px;
                        }
                        .header h1 {
                            color: #007bff;
                            margin: 0;
                            font-size: 24px;
                        }
                        .content {
                            margin-bottom: 20px;
                        }
                        .info-box {
                            background-color: #f8f9fa;
                            border-left: 4px solid #007bff;
                            padding: 15px;
                            margin: 15px 0;
                        }
                        .label {
                            font-weight: bold;
                            color: #495057;
                            display: block;
                            margin-bottom: 5px;
                        }
                        .value {
                            color: #333;
                            margin-bottom: 15px;
                            font-size: 16px;
                        }
                        .message-box {
                            background-color: #fff;
                            border: 1px solid #dee2e6;
                            padding: 15px;
                            border-radius: 4px;
                            margin-top: 15px;
                        }
                        .message-title {
                            font-weight: bold;
                            color: #495057;
                            margin-bottom: 10px;
                            display: block;
                        }
                        .message-content {
                            white-space: pre-wrap;
                            color: #333;
                            line-height: 1.8;
                        }
                        .footer {
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #dee2e6;
                            font-size: 12px;
                            color: #6c757d;
                            text-align: center;
                        }
                        .timestamp {
                            font-size: 12px;
                            color: #6c757d;
                            margin-bottom: 20px;
                            display: block;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📧 Thông tin liên hệ mới</h1>
                        </div>
                        
                        <div class="content">
                            <span class="timestamp">Thời gian nhận: ${new Date().toLocaleString('vi-VN')}</span>
                            
                            <div class="info-box">
                                <span class="label">👤 Người gửi:</span>
                                <span class="value">${data.name}</span>
                                
                                <span class="label">📧 Email:</span>
                                <span class="value">${data.email}</span>
                                
                                <span class="label">📝 Chủ đề:</span>
                                <span class="value">${data.subject}</span>
                            </div>
                            
                            <div class="message-box">
                                <span class="message-title">💬 Nội dung tin nhắn:</span>
                                <div class="message-content">
                                    ${data.content}
                                </div>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>Đây là email tự động từ hệ thống Major Guide</p>
                            <p>Vui lòng không trả lời email này</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            // Send email to admin
            await this.mailService.sendEmail({
                to: 'kewwihuy@gmail.com',
                subject: `📧 Liên hệ mới: ${data.subject}`,
                html: htmlContent,
                senderName: data.name,
                senderEmail: data.email
            });

            this.logger.log(`✅ Contact mail successfully sent to admin: kewwihuy@gmail.com`);

            // Acknowledge the message
            context.getChannelRef().ack(context.getMessage());

        } catch (error) {
            this.logger.error(`❌ Failed to process contact mail:`, error);
            throw error;
        }
    }
}
