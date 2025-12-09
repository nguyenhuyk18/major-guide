import { Module } from "@nestjs/common";
import { ShiftController } from "./controllers/shift.controller";
import { ShiftRepository } from "./repositories/shift.repository";
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftDestination } from '@common/schemas/slot/shift.schema';
import { ShiftService } from "./services/shift.service";

@Module({
    controllers: [ShiftController],
    providers: [ShiftRepository, ShiftService],
    imports: [MongooseModule.forFeature([ShiftDestination])],
})
export class ShiftModule {

}