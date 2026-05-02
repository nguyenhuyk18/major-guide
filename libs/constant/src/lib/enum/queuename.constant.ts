export enum QUEUE_NAME {
    SEND_MAIL_QUEUE = 'mail.send_mail_queue',
    HOLD_DELAY_QUEUE = 'booking.hold_delay_queue',
    HOLD_DEMAND_QUEUE = 'booking.hold_demand_queue',
    HOLD_CANCLE_BOOKING_QUEUE = 'booking.hold_cancle_booking_queue',
    HOLD_CANCLE_QUEUE = 'booking.hold_cancle_queue',
    BOOKING_SUCCESS_STATUS = 'booking.change_status_success',
}

export enum EXCHANGE_NAME {
    BOOKING_EXCHANGE = 'booking_exchange',
    BOOKING_EXCHANGE_CANCLE = 'booking_exchange_cancle'
}


export enum ROUTING_KEY_NAME {
    // queue này dùng để đếm sau đủ 5p sẽ tự gọi đến routing
    BOOKING_DELAY = 'booking.delay',
    BOOKING_CANCLE = 'booking.cancle',
    BOOKING_COMMAND = 'booking.command'
}