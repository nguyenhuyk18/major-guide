import { Injectable } from "@nestjs/common";
import { ProvinceRepository } from "../repositories/province.repository";

@Injectable()
export class ProvinceService {
    constructor(private readonly provinceRepository: ProvinceRepository) { }

    getAll() {
        return this.provinceRepository.getAll();
    }

    getById(id: string) {
        return this.provinceRepository.getById(id)
    }
}