import { Controller } from "@nestjs/common";
import { CloudinaryService } from "../../cloudinary/services/cloudinary.service";
import { MessagePattern } from "@nestjs/microservices";
import { TCP_MEDIA_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';


@Controller()
export class AvartarController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    @MessagePattern(TCP_MEDIA_SERVICE_MESSAGE.UPLOAD_AVARTAR_USER)
    async uploadAvartarUser(@RequestParams() params: { buff: string, filename: string }) {

        console.log(params)
        const url_name = await this.cloudinaryService.uploadFile(Buffer.from(params.buff, 'base64'), params.filename)
        return ResponseTcp.success<string>(url_name)
    }

}