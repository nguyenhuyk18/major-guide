import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';


@Schema({ collection: 'role' })
export class Role extends Base {
    @Prop({ type: String })
    name: string

    // action?: 
}

export const RoleSchema = createSchema(Role)

export const RoleModelName = Role.name

export const RoleDestination = {
    name: RoleModelName,
    schema: RoleSchema
}

export type RoleModel = Model<Role>;

