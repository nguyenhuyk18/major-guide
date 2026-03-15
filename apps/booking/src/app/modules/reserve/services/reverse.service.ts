import { Injectable } from '@nestjs/common';
import { ReverseRepository } from '../repositories/reverse.repository';
import { ReverseTcpRequest } from '@common/interfaces/tcp/booking/reverse-tcp-request.interface';
import { mappingToReverse } from '../mappers';
import { Reverse } from '@common/schemas/booking/reverse.schema';
import { STATUS_BOOKING } from '@common/constant/enum/status_slot.contant';



@Injectable()
export class ReverseService {
    constructor(private readonly reverseRepository: ReverseRepository) { }


    async checkTheReverseExist() {

    }

    addReverse(data: ReverseTcpRequest, id_reverse: string) {
        const newData: Partial<Reverse> = mappingToReverse(data, id_reverse);

        // check xem lịch này có bị ai đặt chưa 



        return this.reverseRepository.saveReverse(newData);


    }


    async updateReverseStatusReverse(uuid_reverse: string, status: STATUS_BOOKING) {
        const tmp = await this.reverseRepository.findByUUid(uuid_reverse);

        if (tmp.status === STATUS_BOOKING.PAIED || tmp.status === STATUS_BOOKING.CANCLE) {
            return;
        }

        return this.reverseRepository.updateReverseByuuid(uuid_reverse, { status })
    }


    async checkIsReversed() {
        return true;
    }
}