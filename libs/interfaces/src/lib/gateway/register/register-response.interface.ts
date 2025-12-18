import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../common/base-response.dto';


// export class ShiftInChargeResponseDto {
//     @ApiProperty()
//     day: string

//     @ApiProperty()
//     shift_id: string
// }

export class RegisterResponseDto extends BaseResponseDto<string> {
    @ApiProperty()
    id_expert: string

    @ApiProperty()
    day: string[]
}