import { ShiftModel, ShiftModelName } from "@common/schemas/slot/shift.schema";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";


@Injectable()
export class ShiftRepository {
    constructor(@InjectModel(ShiftModelName) private shiftModel: ShiftModel) { }

    getAllShift() {
        return this.shiftModel.find();
    }

    getShiftById(id: string) {
        return this.shiftModel.findById(id);
    }
}