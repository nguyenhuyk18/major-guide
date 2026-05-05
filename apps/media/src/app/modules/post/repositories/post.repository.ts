import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema } from 'mongoose';
import { Post, PostModel, PostModelName } from '@common/schemas/media/post.schema';
import { CreatePostTcpRequest, UpdatePostTcpRequest } from '@common/interfaces/tcp/media';

// Define schema explicitly without decorator metadata
const PostSchemaDefinition = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, required: true },
    expertId: { type: String, required: true },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

@Injectable()
export class PostRepository {
    constructor(
        @InjectModel(PostModelName) private readonly postModel: Model<Post>
    ) { }

    async create(data: CreatePostTcpRequest): Promise<Post> {
        const post = new this.postModel({
            title: data.title,
            content: data.content,
            imageUrl: data.imageUrl,
            expertId: data.expertId,
        });
        return post.save();
    }

    async findById(id: string): Promise<Post | null> {
        return this.postModel.findById(id).exec();
    }

    async findByExpertId(expertId: string): Promise<Post[]> {
        return this.postModel.find({ expertId }).sort({ createdAt: -1 }).exec();
    }

    async findAll(): Promise<Post[]> {
        return this.postModel.find().sort({ createdAt: -1 }).exec();
    }

    async update(id: string, data: Partial<UpdatePostTcpRequest>): Promise<Post | null> {
        return this.postModel.findByIdAndUpdate(id, data, { new: true }).exec();
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.postModel.findByIdAndDelete(id).exec();
        return !!result;
    }
}
