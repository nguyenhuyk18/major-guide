import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';


@Schema({ collection: 'shift' })
export class Shift extends Base {
    @Prop({ type: String })
    name_shift: string

    @Prop({ type: String })
    information: string

    @Prop({ type: String })
    start_time: string

    @Prop({ type: String })
    end_time: string
}



export const ShiftSchema = createSchema(Shift)

export const ShiftModelName = Shift.name

export const ShiftDestination = {
    name: ShiftModelName,
    schema: ShiftSchema
}

export type ShiftModel = Model<Shift>;

