import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ShiftInWeekModel, ShiftInWeekModelName } from '@common/schemas/slot/shift-of-day.schema';

@Injectable()
export class ShiftInWeekRepository {
    constructor(@InjectModel(ShiftInWeekModelName) private readonly shiftInWeekModel: ShiftInWeekModel) { }


    getAll() {
        return this.shiftInWeekModel.find();
    }

    getById(id: string) {
        return this.shiftInWeekModel.findById(id);
    }


}