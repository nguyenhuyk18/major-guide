import { Test, TestingModule } from '@nestjs/testing';
import {
  getConnectionToken,
  getModelToken,
  MongooseModule,
} from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { AccountingModule, AccountingService } from './accounting.module';
import { AccountingEntryDto } from '@common/interfaces/accounting/accounting.dto';

const integration = process.env['ACCOUNTING_TEST_MONGO_URI']
  ? describe
  : describe.skip;
integration('Accounting MongoDB persistence (isolated test database)', () => {
  let module: TestingModule;
  let connection: Connection;
  let service: AccountingService;
  const database = `majorguide_accounting_test_${randomUUID().replace(
    /-/g,
    ''
  )}`;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env['ACCOUNTING_TEST_MONGO_URI']!, {
          dbName: database,
          serverSelectionTimeoutMS: 5000,
        }),
        AccountingModule,
      ],
    }).compile();
    connection = module.get(getConnectionToken());
    await Promise.all(
      ['AccountingEntry', 'AccountingInvoice'].map((name) =>
        module.get<Model<any>>(getModelToken(name)).init()
      )
    );
    service = module.get(AccountingService);
  }, 30000);
  afterAll(async () => {
    if (
      connection?.name === database &&
      database.startsWith('majorguide_accounting_test_')
    )
      await connection.dropDatabase();
    if (module) await module.close();
  });
  test('persists entries, deduplicates retries, issues one invoice and filters totals', async () => {
    const income: AccountingEntryDto = {
      requestId: randomUUID(),
      type: 'income',
      date: '2026-09-20',
      amount: 500000,
      category: 'Tư vấn',
      counterparty: 'Test customer',
      description: 'Test consultation',
      reference: 'test',
    };
    const entry: any = await service.create(income, 'test-admin');
    const retried: any = await service.create(income, 'test-admin');
    expect(String(retried._id)).toBe(String(entry._id));
    await expect(
      service.create({ ...income, amount: 900000 }, 'test-admin')
    ).rejects.toThrow('Mã yêu cầu');
    await service.create(
      { ...income, requestId: randomUUID(), type: 'expense', amount: 150000 },
      'test-admin'
    );
    const invoices: any[] = await Promise.all([
      service.invoice(entry._id, 'test-admin'),
      service.invoice(entry._id, 'test-admin'),
    ]);
    expect(String(invoices[0]._id)).toBe(String(invoices[1]._id));
    expect((await service.listInvoices({})).total).toBe(1);
    expect(
      await service.summary({ start: '2026-09-01', end: '2026-09-30' })
    ).toMatchObject({
      income: 500000,
      expense: 150000,
      balance: 350000,
      count: 2,
    });
    expect((await service.list({ start: '2026-10-01' })).total).toBe(0);
  });
});
