import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DAY_IN_WEEK } from '@common/constant/enum/day-in-week.constant';


export class ShiftInChargeRequestDto {
    @ApiProperty({
        type: String,
        enum: DAY_IN_WEEK,
        enumName: 'DAY_IN_WEEK',
        example: DAY_IN_WEEK.MONDAY,
    })
    @IsNotEmpty()
    @IsEnum(DAY_IN_WEEK)
    day?: DAY_IN_WEEK

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    shift_id?: string
}

export class RegisterRequestDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    id_expert?: string

    @ApiProperty({ type: [ShiftInChargeRequestDto] })
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @IsArray()
    @Type(() => ShiftInChargeRequestDto)
    day?: ShiftInChargeRequestDto[]
}