import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Register, RegisterModel, RegisterModelName } from '@common/schemas/slot/register.schema';
import { ObjectId } from "mongodb";

@Injectable()
export class RegisterRepository {
    constructor(@InjectModel(RegisterModelName) private readonly registerModel: RegisterModel) { }

    create(data: Partial<Register>) {
        return this.registerModel.create(data);
    }

    async getByIdShiftInDay(id_shift_in_day: ObjectId) {
        const rs = this.registerModel.find({
            day: { $in: [id_shift_in_day] }
        }).lean()
        return rs;
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
        return this.registerModel.findOne({ id_expert: id_expert }).populate({
            path: 'day',
            select: 'day',
            populate: {
                path: 'shift_id',
                select: 'name_shift information start_time end_time'
            },
        })
    }


    async isExistIdExpert(id_expert: string) {
        const rs = await this.registerModel.findOne({ id_expert: id_expert });

        if (rs) {
            return false;
        }

        return true;
    }
}