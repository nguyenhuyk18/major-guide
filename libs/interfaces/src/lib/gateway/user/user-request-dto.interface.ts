import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty } from "class-validator";

export class FindUserByIds {
    @ApiProperty()
    @IsArray()
    @IsNotEmpty()
    ids: string[]
}