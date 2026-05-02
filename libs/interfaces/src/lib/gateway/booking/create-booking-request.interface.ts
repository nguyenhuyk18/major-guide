import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsNumber, IsString, IsOptional } from "class-validator";

export class CreateBookingRequest {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    id_expert: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    id_shift_in_day: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    day_support: Date;

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    time_start: Date;

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    time_end: Date;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    price_support: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    note?: string;

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
}
