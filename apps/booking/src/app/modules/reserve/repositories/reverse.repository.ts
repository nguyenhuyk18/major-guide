import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Reverse, ReverseModel, ReverseModelName } from '@common/schemas/booking/reverse.schema';
import { STATUS_BOOKING } from '@common/constant/enum/status_slot.contant';



@Injectable()
export class ReverseRepository {
    constructor(@InjectModel(ReverseModelName) private readonly reserveModel: ReverseModel) { }

    saveReverse(data: Partial<Reverse>) {
        const rs = this.reserveModel.create(data);
        return rs;
    }

    checkDateSupport(dateStr: string, expertId: string, shiftId: string) {
        // dateStr is already in YYYY-MM-DD format
        const start = dateStr;
        const end = dateStr;

        return this.reserveModel.findOne({
            id_expert: expertId,
            id_shift_in_day: shiftId,
            day_support: {
                $gte: start,
                $lte: end,
            },
        });
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
            data,
            { new: true }
        )
        return rs;
    }

    updateStripeSession(uuid: string, memberId: string, data: Partial<Reverse>) {
        return this.reserveModel.findOneAndUpdate(
            { id_reverse: uuid, id_member: memberId, status: STATUS_BOOKING.RESERVED },
            data,
            { new: true }
        );
    }

    findByStripeSessionId(sessionId: string) {
        return this.reserveModel.findOne({ stripe_session_id: sessionId });
    }

    markStripePaymentPaid(uuid: string, sessionId: string, data: Partial<Reverse>) {
        return this.reserveModel.findOneAndUpdate(
            { id_reverse: uuid, stripe_session_id: sessionId, status: STATUS_BOOKING.RESERVED },
            { ...data, status: STATUS_BOOKING.PAIED },
            { new: true }
        );
    }

    markStripePaymentFailed(uuid: string, sessionId: string) {
        return this.reserveModel.findOneAndUpdate(
            { id_reverse: uuid, stripe_session_id: sessionId, status: STATUS_BOOKING.RESERVED },
            { status: STATUS_BOOKING.FAILED },
            { new: true }
        );
    }

    findByMemberId(memberId: string) {
        return this.reserveModel.find({ id_member: memberId }).sort({ createdAt: -1 }).exec();
    }

    findByExpertIdWithPagination(expertId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        return this.reserveModel.find({
            id_expert: expertId,
            status: STATUS_BOOKING.PAIED
        }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec();
    }

    countByExpertId(expertId: string) {
        return this.reserveModel.countDocuments({
            id_expert: expertId,
            status: STATUS_BOOKING.PAIED
        }).exec();
    }

    findForDashboard(expertId?: string) {
        const filter = expertId ? { id_expert: expertId } : {};
        return this.reserveModel.find(filter).sort({ createdAt: -1 }).lean().exec();
    }

    updateJoinAt(id_reverse: string, joinAt: Date) {
        return this.reserveModel.findOneAndUpdate(
            { id_reverse },
            { joinAt },
            { new: true }
        );
    }


}
