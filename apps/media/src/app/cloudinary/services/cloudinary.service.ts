import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier'

@Injectable()
export class CloudinaryService {
    private cloudinary = cloudinary;

    constructor(private readonly configService: ConfigService) {
        // console.log(configService.get('CLOUD_SERV.API_KEY'), ' ', configService.get('CLOUD_SERV.API_SECRET'))
        this.cloudinary.config({
            cloud_name: configService.get('CLOUD_SERV.CLOUD_NAME'),
            api_key: configService.get('CLOUD_SERV.API_KEY'),
            api_secret: configService.get('CLOUD_SERV.API_SECRET')
        })
    }

    async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const uploadStream = this.cloudinary.uploader.upload_stream(
                {
                    folder: 'major-guide-app',
                    resource_type: 'auto',
                    public_id: fileName,
                },
                (error, result) => {
                    if (error) {
                        Logger.error('Upload error:', error);
                        return reject(error);
                    }
                    Logger.log('Upload successful:', result);
                    return resolve(result.secure_url);
                },
            );

            streamifier.createReadStream(fileBuffer).pipe(uploadStream);
        });
    }
}