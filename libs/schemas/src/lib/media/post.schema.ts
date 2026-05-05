import { getModelToken } from '@nestjs/mongoose';
import { Model, Schema } from 'mongoose';

export const PostSchemaDefinition = new Schema({
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

export const PostModelName = 'Post';

// Virtual id field
PostSchemaDefinition.virtual('id').get(function () {
    return this._id?.toString();
});

export const PostDestination = {
    name: PostModelName,
    schema: PostSchemaDefinition,
};

export class Post {
    _id: string;
    id: string;
    title: string;
    content: string;
    imageUrl: string;
    expertId: string;
    createdAt: Date;
    updatedAt: Date;
}

export type PostModel = Model<Post>;

// For use in @InjectModel()
export const POST_MODEL_TOKEN = getModelToken(PostModelName);
