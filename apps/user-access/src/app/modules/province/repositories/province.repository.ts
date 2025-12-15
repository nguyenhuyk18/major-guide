import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ProvinceModel, ProvinceModelName } from '@common/schemas/user-access/province.schema';


@Injectable()
export class ProvinceRepository {
    constructor(@InjectModel(ProvinceModelName) private readonly provinceModel: ProvinceModel) { }

    getAll() {
        return this.provinceModel.find();
    }

    getById(id: string) {
        return this.provinceModel.findById(id)
    }


}