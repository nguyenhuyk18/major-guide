import { HTTP_MESSAGE } from "@common/constant/enum/http-message.constant";
import { HttpStatus } from "@nestjs/common";

export class ResponseTcp<T> {
    code: string = HTTP_MESSAGE.OK;
    data?: T;
    error?: string;
    statusCode: HttpStatus.OK;

    constructor(data: Partial<ResponseTcp<T>>) {
        Object.assign(this, data);
    }

    static success<T>(data: T) {
        return new ResponseTcp<T>({ data, code: HTTP_MESSAGE.OK, statusCode: HttpStatus.OK })
    }
}

export type ResponseType<T> = ResponseTcp<T>;
