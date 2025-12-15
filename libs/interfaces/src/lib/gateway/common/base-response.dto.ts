import { ApiProperty } from "@nestjs/swagger";

export class BaseResponseDto<T> {
    @ApiProperty()
    id: T

    @ApiProperty()
    createdAt: Date;


    @ApiProperty()
    updatedAt: Date;

}