import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const ACCOUNTING = {
  LIST: 'accounting.list',
  CREATE: 'accounting.create',
  SUMMARY: 'accounting.summary',
  INVOICES: 'accounting.invoices',
  CREATE_INVOICE: 'accounting.create-invoice',
  SYNC_BOOKINGS: 'accounting.sync-bookings',
};

export class AccountingEntryDto {
  @IsUUID() requestId: string;
  @IsIn(['income', 'expense']) type: 'income' | 'expense';
  @Matches(/^\d{4}-\d{2}-\d{2}$/) date: string;
  @IsInt() @Min(1) @Max(1_000_000_000_000) amount: number;
  @IsString() @MinLength(1) @MaxLength(100) category: string;
  @IsString() @MinLength(1) @MaxLength(200) counterparty: string;
  @IsString() @MinLength(1) @MaxLength(1000) description: string;
  @IsOptional() @IsString() @MaxLength(100) reference?: string;
}

export class AccountingQueryDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) start?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) end?: string;
  @IsOptional() @IsIn(['income', 'expense']) type?: string;
}

export class CreateInvoiceDto {
  @IsString() @MinLength(1) @MaxLength(100) entryId: string;
}
