import { Module } from "@nestjs/common";
import { BookingController } from "./controllers/booking.controller";

@Module({
    imports: [],
    controllers: [BookingController]
})
export class BookingModule {

}
