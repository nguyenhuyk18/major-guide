import { Injectable } from "@nestjs/common";
import { ShiftInWeekRepository } from "../repositories/shift-in-week.repository";

@Injectable()
export class ShiftInWeekService {
    constructor(private readonly shiftInWeekRepoitory: ShiftInWeekRepository) { }


    getAll() {
        return this.shiftInWeekRepoitory.getAll();
    }

    getById(id: string) {
        return this.shiftInWeekRepoitory.getById(id);
    }
}