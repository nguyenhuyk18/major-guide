import { TcpLoggingInterceptor } from "@common/interceptors/tcpLogging.interceptors";
import { Controller, UseInterceptors } from "@nestjs/common";


@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class ChatPrivateController {



    sendToChatPrivate() {
        console.log('gửi đi và lưu tin nhắn vào đúng room phù hợp')
    }














}

