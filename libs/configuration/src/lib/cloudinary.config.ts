import { IsNotEmpty, IsString } from "class-validator";

export class CloudinaryConfiguration {
    @IsString()
    @IsNotEmpty()
    CLOUD_NAME: string;

    @IsString()
    @IsNotEmpty()
    API_KEY: string;

    @IsString()
    @IsNotEmpty()
    API_SECRET: string;

    constructor() {
        this.API_KEY = process.env['CLOUDINARY_API_KEY'] || '';
        this.API_SECRET = process.env['CLOUDINARY_API_SECRET'] || '';
        this.CLOUD_NAME = process.env['CLOUDINARY_CLOUD_NAME'] || '';
    }
}