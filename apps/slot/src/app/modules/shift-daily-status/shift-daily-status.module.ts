import { Module } from "@nestjs/common";
import { ShiftDailyStatusController } from "./controllers/shift-daily-status.controller";
import { ShiftDailyStatusRepository } from "./repositories/shift-daily-status.repository";
import { ShiftDailyStatusService } from "./services/shift-daily-status.service";
import { MongooseModule } from "@nestjs/mongoose";
import { ShiftDailyStatusDestination } from "@common/schemas/slot/shift-daily-status.schema";

@Module({
    imports: [MongooseModule.forFeature([ShiftDailyStatusDestination])],
    providers: [ShiftDailyStatusRepository, ShiftDailyStatusService],
    controllers: [ShiftDailyStatusController],
    exports: [ShiftDailyStatusService]
})
export class ShiftDailyStatusModule {

}