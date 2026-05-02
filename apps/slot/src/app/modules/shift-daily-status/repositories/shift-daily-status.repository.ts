import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ShiftDailyStatusModel, ShiftDailyStatusModelName } from '@common/schemas/slot/shift-daily-status.schema';
import { ShiftDailyStatus } from '@common/schemas/slot/shift-daily-status.schema';
import { STATUS_SLOT } from '@common/constant/enum/status_slot.contant';
import { ObjectId } from 'mongodb';

@Injectable()
export class ShiftDailyStatusRepository {
    constructor(@InjectModel(ShiftDailyStatusModelName) private readonly shiftDailyStatusModel: ShiftDailyStatusModel) { }

    /**
     * Create a new shift daily status
     */
    create(shiftDailyStatusData: Partial<ShiftDailyStatus>) {
        const createdShiftDailyStatus = new this.shiftDailyStatusModel(shiftDailyStatusData);
        return createdShiftDailyStatus.save();
    }

    /**
     * Find all shift daily statuses with optional filtering
     */
    findAll(filter: any = {}) {
        return this.shiftDailyStatusModel.find(filter).populate('id_shift_in_day').exec();
    }

    /**
     * Find shift daily status by ID
     */
    findById(id: string) {
        return this.shiftDailyStatusModel.findById(id).populate('id_shift_in_day').exec();
    }


    /**
 * Find shift daily status by uuid
 */
    findByIdReverse(id: string) {
        return this.shiftDailyStatusModel.findOne({ id_reverse: id }).populate('id_shift_in_day').exec();
    }

    /**
     * Find shift daily status by expert ID
     */
    findByExpertId(expertId: string) {
        return this.shiftDailyStatusModel.find({ id_expert: expertId }).populate('id_shift_in_day').exec();
    }

    /**
     * Find shift daily status by booking ID
     */
    findByBookingId(bookingId: string) {
        return this.shiftDailyStatusModel.findOne({ booking_id: bookingId }).populate('id_shift_in_day').exec();
    }

    /**
     * Find shift daily status by date
     */
    findByDate(date: Date) {
        return this.shiftDailyStatusModel.find({
            date_reverse: {
                $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
        }).populate('id_shift_in_day').exec();
    }

    /**
     * Find shift daily status by status
     */
    findByStatus(status: STATUS_SLOT) {
        return this.shiftDailyStatusModel.find({ status }).populate('id_shift_in_day').exec();
    }

    /**
     * Find shift daily status by shift in day ID
     */
    findByShiftInDayId(shiftInDayId: ObjectId) {
        return this.shiftDailyStatusModel.find({ id_shift_in_day: shiftInDayId }).populate('id_shift_in_day').exec();
    }

    /**
     * Find all shift daily statuses by date, shift in day ID, and expert ID combined
     */
    findByDateAndShiftAndExpert(date: Date, id_shift_in_day: string, id_expert: string) {
        return this.shiftDailyStatusModel.find({
            id_expert,
            id_shift_in_day: new ObjectId(id_shift_in_day),
            date_reverse: {
                $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
        }).populate('id_shift_in_day').exec();
    }

    /**
     * Update shift daily status by ID
     */
    updateByUuid(id: string, updateData: Partial<ShiftDailyStatus>) {
        return this.shiftDailyStatusModel.findOneAndUpdate(
            { id_reverse: id },
            updateData,
            { new: true }
        ).populate('id_shift_in_day').exec();
    }

    /**
     * Update shift daily status by booking ID
     */
    updateByBookingId(bookingId: string, updateData: Partial<ShiftDailyStatus>) {
        return this.shiftDailyStatusModel.findOneAndUpdate(
            { booking_id: bookingId },
            updateData,
            { new: true }
        ).populate('id_shift_in_day').exec();
    }

    /**
     * Delete shift daily status by ID
     */
    deleteById(id: string) {
        return this.shiftDailyStatusModel.findByIdAndDelete(id).populate('id_shift_in_day').exec();
    }

    /**
     * Delete shift daily status by booking ID
     */
    deleteByBookingId(bookingId: string) {
        return this.shiftDailyStatusModel.findOneAndDelete({ booking_id: bookingId }).populate('id_shift_in_day').exec();
    }

    /**
     * Count shift daily statuses with optional filtering
     */
    async count(filter: any = {}): Promise<number> {
        return this.shiftDailyStatusModel.countDocuments(filter).exec();
    }

    /**
     * Check if a booking exists for a specific expert and date
     */
    async checkBookingExists(expertId: string, date: Date, bookingId?: string): Promise<boolean> {
        const query: any = {
            id_expert: expertId,
            date_reverse: {
                $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
        };

        // If bookingId is provided, exclude it from the check (for update operations)
        if (bookingId) {
            query.booking_id = { $ne: bookingId };
        }

        const count = await this.shiftDailyStatusModel.countDocuments(query).exec();
        return count > 0;
    }

    /**
     * Get available slots for an expert on a specific date
     */
    // async getAvailableSlotsForExpert(expertId: string, date: Date): Promise<ShiftDailyStatus[]> {
    //     return this.shiftDailyStatusModel.find({
    //         id_expert: expertId,
    //         date_reverse: {
    //             $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    //             $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    //         },
    //         status: STATUS_SLOT.AVAILABLE
    //     }).populate('id_shift_in_day').exec();
    // }
}
