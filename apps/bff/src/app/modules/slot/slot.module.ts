import { Module } from "@nestjs/common";
import { ClientsModule } from '@nestjs/microservices'
import { TCP_SERVICE, TcpProvider } from '@common/configuration/tcp.config';
import { ShiftController } from "./controllers/shift.controller";
import { RegisterController } from "./controllers/register.controller";
import { ShiftInDayController } from "./controllers/shift-in-day.controller";
import { ShiftDailyStatusController } from "./controllers/shift-daily-status.controller";

@Module({
    imports: [
        ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.SLOT_SERVICE)])
    ],
    // providers: [],
    // exports: [],
    controllers: [ShiftController, RegisterController, ShiftInDayController, ShiftDailyStatusController]
})
export class SlotModule {

}
