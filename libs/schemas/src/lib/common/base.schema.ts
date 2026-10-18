import { Type } from "@nestjs/common";
import { Prop, SchemaFactory, Virtual } from "@nestjs/mongoose";
import { ObjectId } from 'mongodb'



export class Base {
    _id: ObjectId;

    @Virtual({
        get: (doc: any) => doc?._id?.toString()
    })
    id: string;

    // Defaults must be functions: `new Date()` here would be evaluated once when the
    // service starts, stamping every document with the start-up time.
    @Prop({ type: Date, default: () => new Date() })
    createdAt: Date;

    @Prop({ type: Date, default: () => new Date() })
    updatedAt: Date;
}

export const createSchema = <TClass = any>(target: Type<TClass>) => {
    const schema = SchemaFactory.createForClass(target);

    schema.set('toJSON', {
        virtuals: true
    })

    schema.set('toObject', {
        virtuals: true
    })

    schema.set('versionKey', false)

    schema.set('timestamps', true)

    return schema
}