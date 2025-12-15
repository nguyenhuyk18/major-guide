import { Injectable } from "@nestjs/common";
import { WardRepository } from "../repositories/ward.repository";

@Injectable()
export class WardService {
    constructor(private readonly wardRepository: WardRepository) { }

    getAll() {
        return this.wardRepository.getAll();
    }

    getById(id: string) {
        return this.wardRepository.getById(id)
    }
}