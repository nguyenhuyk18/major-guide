import { Injectable } from "@nestjs/common";
import { ShiftRepository } from "../repositories/shift.repository";
import { Shift } from "@common/schemas/slot/shift.schema";

@Injectable()
export class ShiftService {
    constructor(private readonly shiftRepository: ShiftRepository) { }

    getAllShift(): Promise<Shift[]> {
        return this.shiftRepository.getAllShift()
    }

    getShiftById(id: string) {
        return this.shiftRepository.getShiftById(id);
    }
}
