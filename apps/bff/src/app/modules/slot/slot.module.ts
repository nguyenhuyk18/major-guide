import { Module } from "@nestjs/common";
import { ClientsModule } from '@nestjs/microservices'
import { TCP_SERVICE, TcpProvider } from '@common/configuration/tcp.config';
import { ShiftController } from "./controllers/shift.controller";

@Module({
    imports: [
        ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.SLOT_SERVICE)])
    ],
    // providers: [],
    // exports: [],
    controllers: [ShiftController]
})
export class SlotModule {

}