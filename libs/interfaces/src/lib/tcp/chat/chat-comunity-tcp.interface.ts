// import { ChatComunityRequestDto } from "../../gateway/chat";

export class ChatComunityTcpRequest {
    // @ApiProperty()
    // @IsNotEmpty()
    // @IsString()
    content: string;

    // @ApiProperty()
    // @IsNotEmpty()
    // @IsString()
    sendBy: string;

    // @ApiProperty()
    // @IsString()
    replyTo?: string;
}