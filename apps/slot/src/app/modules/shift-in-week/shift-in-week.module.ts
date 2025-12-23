import { Module } from "@nestjs/common";
import { ShiftInWeekRepository } from "./repositories/shift-in-week.repository";
import { ShiftInWeekService } from "./services/shift-in-week.service";
import { ShiftInWeekController } from "./controllers/shift-in-week.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { ShiftInWeekDestination } from "@common/schemas/slot/shift-of-day.schema";
import { RegisterModule } from "../register/register.module";
// import { ShiftModule } from "../shift/shift.module";

@Module({
    imports: [MongooseModule.forFeature([ShiftInWeekDestination]), RegisterModule],
    providers: [ShiftInWeekRepository, ShiftInWeekService],
    controllers: [ShiftInWeekController]
})
export class ShiftInWeekModule {

}