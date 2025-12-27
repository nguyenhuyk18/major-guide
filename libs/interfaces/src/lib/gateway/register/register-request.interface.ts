import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDate, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';





export class RegisterRequestDto {

    id_expert?: string

    @ApiProperty()
    @IsNotEmpty()
    @IsArray()
    day?: string[]


    // @ApiProperty({
    //     type: String,
    //     format: 'date-time',
    //     example: '2025-01-15T00:00:00.000Z',
    // })
    // @IsNotEmpty()
    // @Type(() => Date)
    // @IsDate()
    // available_date?: Date
}