import { Module } from "@nestjs/common";
import { PaymentController } from "./controllers/payment.controller";
import { PaymentService } from "./services/payment.service";
import { ReverseModule } from "../reserve/reserve.module";
import { AccountingModule } from "../accounting/accounting.module";

@Module(
    {
        controllers: [PaymentController],
        providers: [PaymentService],
        imports: [ReverseModule, AccountingModule]
    }
)
export class PaymentModule { }