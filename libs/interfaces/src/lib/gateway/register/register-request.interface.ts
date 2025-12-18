import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';





export class RegisterRequestDto {

    id_expert?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsArray()
    day?: string[]
}