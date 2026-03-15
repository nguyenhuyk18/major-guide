import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { Authorization } from "@common/decorators/authorizer.decorator";
import { ProcessId } from "@common/decorators/processid.decorator";
import { ReverseGatewayRequest } from "@common/interfaces/gateway/booking/reverse-gateway-request.interface";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Body, Inject, Post } from "@nestjs/common";
import { Controller } from "@nestjs/common/decorators/core/controller.decorator";
import { ApiTags } from "@nestjs/swagger";

@Controller('shift-daily-status')
@ApiTags('Shift Daily Status')
export class ShiftDailyStatusController {
    constructor(@Inject(TCP_SERVICE.SLOT_SERVICE) private shiftDailyStatusClient: TcpClient) { }


    // @Post()
    // @Authorization({ secured: true })
    // bookingPlace(@Body() data: ReverseGatewayRequest, @ProcessId() processId: string) {

    // }





}