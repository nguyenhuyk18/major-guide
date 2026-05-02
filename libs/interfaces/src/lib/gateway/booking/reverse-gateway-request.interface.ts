import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class ReverseGatewayRequest {
    // @Prop({ type: String })
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    id_expert: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    id_shift_in_day: string;


    // @Prop({ type: String })
    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    day_support: Date;

    // @Prop({ type: Date })
    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    time_start: Date;

    // @Prop({ type: Date })
    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    time_end: Date;


    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    price_support: number;



    @ApiProperty()
    @IsString()
    note: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name_customer: string;


    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name_expert: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    avatar_expert: string;



    // @ApiProperty()
    // @IsNotEmpty()
    // @IsString()
    // email_customer: string;
}