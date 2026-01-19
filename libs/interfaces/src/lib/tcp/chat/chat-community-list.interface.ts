import { ChatComunity } from "@common/schemas/chat/chat-comunity.schema";

export class ChatCommunityTcpResponeList {
    chatList: ChatComunity[];
    hasMore: boolean
}