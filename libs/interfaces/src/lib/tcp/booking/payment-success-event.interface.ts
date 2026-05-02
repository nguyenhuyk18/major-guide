import { STATUS_SLOT } from '@common/constant/enum/status_slot.contant';

export class PaymentSuccessEventTcp {
  uuid_reverse: string;
  status_hold: STATUS_SLOT;
  payment_link: string;
  transaction_id?: string;
  payment_date?: Date;
}
