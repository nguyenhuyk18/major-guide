import { ApiProperty } from "@nestjs/swagger";
// import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateLinkApiVnpayRequest {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    orderId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    description: string;

    // @ApiProperty()
    // @IsNotEmpty()
    // @IsString()
    // returnUrl: string; // Link quay lại web sau khi thanh toán xong
}