import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';





@Schema({ collection: 'province' })
export class Province extends Base {
    @Prop({ type: String })
    name: string
}

export const ProvinceSchema = createSchema(Province)

export const ProvinceModelName = Province.name

export const ProvinceDestination = {
    name: ProvinceModelName,
    schema: ProvinceSchema
}

export type ProvinceModel = Model<Province>;

