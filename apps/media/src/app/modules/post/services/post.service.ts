import { Injectable, NotFoundException } from '@nestjs/common';
import { PostRepository } from '../repositories/post.repository';
import { CloudinaryService } from '../../cloudinary/services/cloudinary.service';
import { CreatePostTcpRequest, UpdatePostTcpRequest } from '@common/interfaces/tcp/media';
import { Post } from '@common/schemas/media/post.schema';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class PostService {
    constructor(
        private readonly postRepository: PostRepository,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    async create(data: CreatePostTcpRequest): Promise<Post> {
        return this.postRepository.create(data);
    }

    async findById(id: string): Promise<Post> {
        const post = await this.postRepository.findById(id);
        if (!post) {
            throw new NotFoundException('Post not found');
        }
        return post;
    }

    async findByExpertId(expertId: string): Promise<{ posts: Post[] }> {
        const rs = await this.postRepository.findByExpertId(expertId);
        return {
            posts : rs
        }
    }

    async findAll(): Promise<{ posts: Post[] }> {
        const rs = await this.postRepository.findAll();
        return {
            posts : rs
        }
    }

    async update(id: string, data: UpdatePostTcpRequest): Promise<Post> {
        const existingPost = await this.postRepository.findById(id);
        if (!existingPost) {
            throw new NotFoundException('Post not found');
        }

        if (data.isNewImage && data.imageUrl && data.imageUrl !== existingPost.imageUrl) {
            await this.deleteImageFromCloudinary(existingPost.imageUrl);
        }

        const post = await this.postRepository.update(id, data);
        if (!post) {
            throw new NotFoundException('Post not found');
        }
        return post;
    }

    async delete(id: string): Promise<boolean> {
        const existingPost = await this.postRepository.findById(id);
        if (!existingPost) {
            throw new NotFoundException('Post not found');
        }

        await this.deleteImageFromCloudinary(existingPost.imageUrl);
        return this.postRepository.delete(id);
    }

    async uploadImage(fileBuffer: string, fileName: string): Promise<string> {
        return this.cloudinaryService.uploadFile(Buffer.from(fileBuffer, 'base64'), fileName);
    }

    private async deleteImageFromCloudinary(imageUrl: string): Promise<void> {
        try {
            const publicId = this.extractPublicIdFromUrl(imageUrl);
            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        } catch (error) {
            console.error('Error deleting image from Cloudinary:', error);
        }
    }

    private extractPublicIdFromUrl(url: string): string | null {
        try {
            const parts = url.split('/');
            const fileName = parts[parts.length - 1];
            const publicId = fileName.split('.')[0];
            const folderIndex = parts.indexOf('major-guide-app');
            if (folderIndex !== -1) {
                return `major-guide-app/${publicId}`;
            }
            return publicId;
        } catch {
            return null;
        }
    }
}
