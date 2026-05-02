export class CreateBookingTcpRequest {
    id_expert: string;
    id_member: string;
    id_shift_in_day: string;
    day_support: Date;
    time_start: Date;
    time_end: Date;
    price_support: number;
    name_customer: string;
    email_customer: string;
    name_expert: string;
    avatar_expert: string;
    note?: string;
}
