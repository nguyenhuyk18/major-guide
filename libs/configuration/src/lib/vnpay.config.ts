import { IsNotEmpty, IsString } from "class-validator";


export class VNPayConfiguration {
    @IsNotEmpty()
    @IsString()
    VNP_TMN_CODE: string;

    @IsNotEmpty()
    @IsString()
    VNP_HASH_SECRET: string;

    @IsNotEmpty()
    @IsString()
    VNP_URL: string;

    @IsNotEmpty()
    @IsString()
    VNP_RETURN_URL: string;

    // @IsNotEmpty()
    // @IsString()
    // VNP_IPN_URL: string;

    @IsNotEmpty()
    @IsString()
    VNP_LOCALE: string;

    // @IsNotEmpty()
    // @IsString()
    // VNP_CURR_CODE: string;

    constructor() {
        this.VNP_TMN_CODE = process.env['VNP_TMN_CODE'] ? process.env['VNP_TMN_CODE'] : '';
        this.VNP_HASH_SECRET = process.env['VNP_HASH_SECRET'] ? process.env['VNP_HASH_SECRET'] : '';
        this.VNP_URL = process.env['VNP_URL'] ? process.env['VNP_URL'] : '';

        this.VNP_RETURN_URL = process.env['VNP_RETURN_URL'] ? process.env['VNP_RETURN_URL'] : '';
        // this.VNP_IPN_URL = process.env['VNP_IPN_URL'] ? process.env['VNP_IPN_URL'] : '';
        this.VNP_LOCALE = process.env['VNP_LOCALE'] ? process.env['VNP_LOCALE'] : '';
    }
}