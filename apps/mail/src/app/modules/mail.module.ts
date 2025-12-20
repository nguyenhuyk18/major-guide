import { Module } from "@nestjs/common";
import { MailService } from "./mail/services/mail.service";
import { MailController } from "./mail/controllers/mail.controller";
@Module({
    imports: [],
    controllers: [MailController],
    providers: [MailService]
})
export class MailModule {

}