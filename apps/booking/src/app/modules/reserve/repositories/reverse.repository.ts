import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Reverse, ReverseModel, ReverseModelName } from '@common/schemas/booking/reverse.schema';



@Injectable()
export class ReverseRepository {
    constructor(@InjectModel(ReverseModelName) private readonly reserveModel: ReverseModel) { }

    saveReverse(data: Partial<Reverse>) {
        const rs = this.reserveModel.create(data);
        return rs;
    }


    getReverseById(id: string) {
        const rs = this.reserveModel.findById(id);
        return rs;
    }


    getAllRevers() {
        const rs = this.reserveModel.find();
        return rs;
    }

    updateReverse(id: string, data: Partial<Reverse>) {
        const rs = this.reserveModel.findByIdAndUpdate(id, data);
        return rs;
    }


    findByUUid(uuid: string) {
        const rs = this.reserveModel.findOne({ id_reverse: uuid });
        return rs;
    }


    updateReverseByuuid(uuid: string, data: Partial<Reverse>) {
        const rs = this.reserveModel.findOneAndUpdate(
            { id_reverse: uuid },
            { status: data.status }
        )
        return rs;
    }


}