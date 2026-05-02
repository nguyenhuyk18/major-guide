import { Module } from "@nestjs/common";
import { MailController } from "./controllers/mail.controller";
import { MailService } from "./services/mail.service";
import { PDFGeneratorModule } from "../pdf-generator/pdf-generator.module";
import { ClientsModule } from "@nestjs/microservices";
import { TCP_SERVICE, TcpProvider } from "@common/configuration/tcp.config";

@Module({
    imports: [
        PDFGeneratorModule,
        ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.MEDIA_SERVICE)]),
    ],
    controllers: [MailController],
    providers: [MailService]
})
export class MailModule {

}
