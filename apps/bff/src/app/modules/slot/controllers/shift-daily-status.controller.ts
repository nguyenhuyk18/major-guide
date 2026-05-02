import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { ProcessId } from "@common/decorators/processid.decorator";
import { ResponseDto } from "@common/interfaces/gateway/response-gateway.dto";
import { ShiftDailyStatusCheckRequest, ShiftDailyStatusCheckResponse } from "@common/interfaces/tcp/shift-daily-status/shift-daily-status-tcp.interface";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { TCP_SLOT_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { Get, Inject, Query } from "@nestjs/common";
import { Controller } from "@nestjs/common/decorators/core/controller.decorator";
import { ApiOkResponse, ApiQuery, ApiTags } from "@nestjs/swagger";
import { firstValueFrom, map } from "rxjs";

@Controller('shift-daily-status')
@ApiTags('Shift Daily Status')
export class ShiftDailyStatusController {
    constructor(@Inject(TCP_SERVICE.SLOT_SERVICE) private shiftDailyStatusClient: TcpClient) { }

    @Get('check-status')
    @ApiOkResponse({ type: ResponseDto<ShiftDailyStatusCheckResponse> })
    @ApiQuery({ name: 'date-reverse', required: false, type: Date, format: 'date-time' })
    @ApiQuery({ name: 'id-shift-in-day', required: false, type: String })
    @ApiQuery({ name: 'id-expert', required: false, type: String })
    async checkSlotAvailable(
        @ProcessId() processId: string,
        @Query('date-reverse') dateReverse: string,
        @Query('id-shift-in-day') id_shift_in_day: string,
        @Query('id-expert') id_expert: string
    ) {
        const rs = await firstValueFrom(
            this.shiftDailyStatusClient
                .send<ShiftDailyStatusCheckResponse, ShiftDailyStatusCheckRequest>(
                    TCP_SLOT_SERVICE_MESSAGE.GET_SHIFT_DAILY_SLOT,
                    {
                        data: {
                            date_reverse: new Date(dateReverse),
                            id_shift_in_day,
                            id_expert
                        },
                        processId
                    }
                )
                .pipe(map(row => row.data))
        );

        return new ResponseDto<ShiftDailyStatusCheckResponse>({ data: rs });
    }

}
