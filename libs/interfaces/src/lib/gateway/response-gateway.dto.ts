import { HTTP_MESSAGE } from '@common/constant/enum/http-message.constant';
import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common'

export class ResponseDto<T> {
    @ApiProperty()
    message = HTTP_MESSAGE.OK;

    @ApiProperty()
    data?: T;

    @ApiProperty()
    processID?: string;

    @ApiProperty()
    statusCode = HttpStatus.OK;

    @ApiProperty()
    duration?: string;

    constructor(data: Partial<ResponseDto<T>>) {
        Object.assign(this, data);
    }
}