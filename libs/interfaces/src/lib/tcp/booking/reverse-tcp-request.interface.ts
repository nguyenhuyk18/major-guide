

export class ReverseTcpRequest {
    // @IsNotEmpty()
    // @IsString()
    id_expert: string;

    // @Prop({ type: String })
    // @IsNotEmpty()
    // @IsDate()
    day_support: Date;

    // @Prop({ type: Date })
    // @IsNotEmpty()
    // @IsDate()
    time_start: Date;

    // @Prop({ type: Date })
    // @IsNotEmpty()
    // @IsDate()
    time_end: Date;


    id_member: string;

    id_shift_in_day: string;


    price_support: number;

    // id_reverse: string
}