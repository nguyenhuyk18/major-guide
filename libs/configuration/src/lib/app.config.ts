import { IsNumber } from "class-validator";

export class AppConfiguration {
    @IsNumber()
    PORT?: number;

    @IsNumber()
    SLOT_PORT?: number;

    @IsNumber()
    USER_ACCESS_PORT?: number;

    @IsNumber()
    MEDIA_PORT?: number;

    @IsNumber()
    AUTHORIZER_PORT?: number;

    @IsNumber()
    MAIL_SERVICE_PORT?: number;

    @IsNumber()
    BOOKING_PORT?: number;

    @IsNumber()
    CHAT_PORT?: number;


    constructor() {
        this.PORT = process.env['PORT'] ? Number(process.env['PORT']) : 3300;
        this.SLOT_PORT = process.env['SLOT_PORT'] ? Number(process.env['SLOT_PORT']) : 3301;
        this.USER_ACCESS_PORT = process.env['USER_ACCESS_PORT'] ? Number(process.env['USER_ACCESS_PORT']) : 3302;
        this.MEDIA_PORT = process.env['MEDIA_PORT'] ? Number(process.env['MEDIA_PORT']) : 3303;
        this.AUTHORIZER_PORT = process.env['AUTHORIZER_PORT'] ? Number(process.env['AUTHORIZER_PORT']) : 3304;
        this.MAIL_SERVICE_PORT = process.env['MAIL_SERVICE_PORT'] ? Number(process.env['MAIL_SERVICE_PORT']) : 3305;
        this.BOOKING_PORT = process.env['BOOKING_PORT'] ? Number(process.env['BOOKING_PORT']) : 3306;
        this.CHAT_PORT = process.env['CHAT_PORT'] ? Number(process.env['CHAT_PORT']) : 3307;
    }
}