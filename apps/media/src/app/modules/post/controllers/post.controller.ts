import { Controller } from "@nestjs/common";
import { PostService } from "../services/post.service";
import { MessagePattern } from "@nestjs/microservices";
import { TCP_MEDIA_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { CreatePostTcpRequest, UpdatePostTcpRequest, DeletePostTcpRequest, GetPostByIdTcpRequest, GetPostsByExpertTcpRequest, UploadImageTcpRequest } from '@common/interfaces/tcp/media';
import { Post } from '@common/schemas/media/post.schema';
import { RequestParams } from "@common/decorators/request-params.decorator";

interface TcpPayload<T> {
    data: T;
    processId: string;
}

@Controller()
export class PostController {
    constructor(private readonly postService: PostService) { }

    @MessagePattern(TCP_MEDIA_SERVICE_MESSAGE.UPLOAD_IMAGE)
    async uploadImage(payload: TcpPayload<UploadImageTcpRequest>) {
        const url = await this.postService.uploadImage(payload.data.fileBuffer, payload.data.fileName);
        return ResponseTcp.success<{ url: string }>({ url });
    }

    @MessagePattern(TCP_MEDIA_SERVICE_MESSAGE.CREATE_POST)
    async createPost(@RequestParams() data: CreatePostTcpRequest) {
        console.log('📝 [PostController] createPost received data:', JSON.stringify(data, null, 2));
        const post = await this.postService.create(data);
        return ResponseTcp.success<Post>(post);
    }

    @MessagePattern(TCP_MEDIA_SERVICE_MESSAGE.GET_POST_BY_ID)
    async getPostById(payload: TcpPayload<GetPostByIdTcpRequest>) {
        const post = await this.postService.findById(payload.data.id);
        return ResponseTcp.success<Post>(post);
    }

    @MessagePattern(TCP_MEDIA_SERVICE_MESSAGE.GET_POSTS_BY_EXPERT)
    async getPostsByExpert(payload: TcpPayload<GetPostsByExpertTcpRequest>) {
        const posts = await this.postService.findByExpertId(payload.data.expertId);
        return ResponseTcp.success<{ posts: Post[] }>(posts);
    }

    @MessagePattern(TCP_MEDIA_SERVICE_MESSAGE.GET_ALL_POSTS)
    async getAllPosts() {
        const posts = await this.postService.findAll();
        return ResponseTcp.success<{ posts: Post[] }>(posts);
    }

    @MessagePattern(TCP_MEDIA_SERVICE_MESSAGE.UPDATE_POST)
    async updatePost(payload: TcpPayload<UpdatePostTcpRequest>) {
        const post = await this.postService.update(payload.data.id, payload.data);
        return ResponseTcp.success<Post>(post);
    }

    @MessagePattern(TCP_MEDIA_SERVICE_MESSAGE.DELETE_POST)
    async deletePost(payload: TcpPayload<DeletePostTcpRequest>) {
        await this.postService.delete(payload.data.id);
        return ResponseTcp.success<{ deleted: boolean }>({ deleted: true });
    }
}
