import { IsNotEmpty, IsString } from "class-validator";

export class GoogleCalendarConfiguration {
    @IsString()
    @IsNotEmpty()
    GOOGLE_CLIENT_EMAIL: string;

    @IsString()
    @IsNotEmpty()
    GOOGLE_PRIVATE_KEY: string;

    // @IsString()
    // @IsNotEmpty()
    // API_SECRET: string;

    constructor() {
        this.GOOGLE_CLIENT_EMAIL = process.env['GOOGLE_CLIENT_EMAIL'] || '';
        this.GOOGLE_PRIVATE_KEY = process.env['GOOGLE_PRIVATE_KEY'] || '';
       
    }
}