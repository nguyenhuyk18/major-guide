import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class RegisterRequestDto {

    id_expert?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsArray()
    day?: string[]
}