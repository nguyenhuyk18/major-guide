import { Module } from "@nestjs/common";
import { ReverseController } from "./controllers/reverse.controller";
import { ReverseRepository } from "./repositories/reverse.repository";
import { ReverseService } from "./services/reverse.service";
import { ClientsModule } from "@nestjs/microservices";
import { RABBIT_SERVICE, RabbitProvider } from "@common/configuration/rabbit.config";
import { MongooseModule } from "@nestjs/mongoose";
import { ReverseDestination } from "@common/schemas/booking/reverse.schema";


@Module({
    imports: [ClientsModule.registerAsync([RabbitProvider(RABBIT_SERVICE.BOOKING_STATUS_SUCCESS), RabbitProvider(RABBIT_SERVICE.BOOKING_HOLD_DELAY), RabbitProvider(RABBIT_SERVICE.BOOKING_HOLD_DEMAND), RabbitProvider(RABBIT_SERVICE.BOOKING_HOLD_CANCEL), RabbitProvider(RABBIT_SERVICE.MAIL_SERVICE)]), MongooseModule.forFeature([ReverseDestination])],
    controllers: [ReverseController],
    providers: [ReverseRepository, ReverseService],
    exports: [ReverseService]
})
export class ReverseModule {

}


// RabbitProvider(RABBIT_SERVICE.BOOKING_HOLD_CANCEL),