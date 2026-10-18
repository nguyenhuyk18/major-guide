import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Post,
  Query,
} from '@nestjs/common';
import { firstValueFrom, timeout } from 'rxjs';
import {
  ACCOUNTING,
  AccountingEntryDto,
  AccountingQueryDto,
  CreateInvoiceDto,
} from '@common/interfaces/accounting/accounting.dto';
import { TCP_SERVICE } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { Roles } from '@common/decorators/role.decorator';
import { UserInfo } from '@common/decorators/get-user.decorator';
import { ROLE } from '@common/constant/enum/action.constant';
import { User } from '@common/schemas/user-access/user.schema';

@Controller('accounting')
@Authorization({ secured: true })
@Roles([ROLE.ADMIN])
export class AccountingController {
  constructor(@Inject(TCP_SERVICE.BOOKING_SERVICE) private client: TcpClient) {}
  private async call(pattern: string, data: any, actor?: string) {
    const result: any = await firstValueFrom(
      this.client.send(pattern, { data, actor } as any).pipe(timeout(15000))
    );
    if (result.statusCode !== 200)
      throw new HttpException(
        result.message || 'Không thể xử lý dữ liệu kế toán.',
        result.statusCode || 502
      );
    return new ResponseDto({ data: result.data });
  }
  @Get('entries') list(@Query() query: AccountingQueryDto) {
    return this.call(ACCOUNTING.LIST, query);
  }
  @Get('summary') summary(@Query() query: AccountingQueryDto) {
    return this.call(ACCOUNTING.SUMMARY, query);
  }
  @Post('entries') create(
    @Body() data: AccountingEntryDto,
    @UserInfo() user: User
  ) {
    return this.call(ACCOUNTING.CREATE, data, user.id);
  }
  // Imports paid bookings that are not in the ledger yet (idempotent).
  @Post('sync-bookings') syncBookings(@UserInfo() user: User) {
    return this.call(ACCOUNTING.SYNC_BOOKINGS, {}, user.id);
  }
  @Get('invoices') invoices(@Query() query: AccountingQueryDto) {
    return this.call(ACCOUNTING.INVOICES, query);
  }
  @Post('invoices') invoice(
    @Body() data: CreateInvoiceDto,
    @UserInfo() user: User
  ) {
    return this.call(ACCOUNTING.CREATE_INVOICE, data, user.id);
  }
}
