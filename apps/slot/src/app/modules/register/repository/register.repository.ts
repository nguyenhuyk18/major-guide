import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Register, RegisterModel, RegisterModelName } from '@common/schemas/slot/register.schema';


@Injectable()
export class RegisterRepository {
    constructor(@InjectModel(RegisterModelName) private readonly registerModel: RegisterModel) { }

    create(data: Partial<Register>) {
        return this.registerModel.create(data);
    }

    update(id: string, data: Partial<Register>) {
        return this.registerModel.findByIdAndUpdate(id, data)
    }

    deleteById(id: string) {
        return this.registerModel.findByIdAndDelete(id);
    }

    getAll() {
        return this.registerModel.find()
    }

    getById(id: string) {
        return this.registerModel.findById(id);
    }

    getByIdExpert(id_expert: string) {
        return this.registerModel.findOne({ id_expert: id_expert })
    }
}