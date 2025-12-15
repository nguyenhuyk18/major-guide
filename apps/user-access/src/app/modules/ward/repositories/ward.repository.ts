import { Injectable } from "@nestjs/common";
import { WardModel, WardModelName } from '@common/schemas/user-access/ward.schema';
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class WardRepository {
    constructor(@InjectModel(WardModelName) private readonly wardModel: WardModel) { }

    getAll() {
        return this.wardModel.find();
    }

    getById(id: string) {
        return this.wardModel.findById(id).populate('province_id')
    }
}