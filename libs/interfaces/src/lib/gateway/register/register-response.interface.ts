import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../common/base-response.dto';


export class RegisterResponseDto extends BaseResponseDto<string> {
    @ApiProperty()
    id_expert: string

    @ApiProperty()
    day: string[]
}