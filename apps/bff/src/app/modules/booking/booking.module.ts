import { Module } from "@nestjs/common";
import { BookingController } from "./controllers/booking.controller";
import { ClientsModule } from "@nestjs/microservices";
import { TCP_SERVICE, TcpProvider } from "@common/configuration/tcp.config";
import { PaymentController } from "./controllers/payment.controller";

@Module({
    imports: [ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.BOOKING_SERVICE)])],
    controllers: [BookingController, PaymentController]
})
export class BookingModule {

}
