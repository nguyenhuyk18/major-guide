import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';
// import { DAY_IN_WEEK } from '@common/constant/enum/day-in-week.constant';
import { ObjectId } from 'mongodb'




@Schema({ collection: 'ward' })
export class Ward extends Base {
    @Prop({ type: String })
    name: string



    @Prop({ type: ObjectId, ref: 'Province' })
    province_id: ObjectId
}



export const WardSchema = createSchema(Ward)

export const WardModelName = Ward.name

export const WardDestination = {
    name: WardModelName,
    schema: WardSchema
}

export type WardModel = Model<Ward>;

