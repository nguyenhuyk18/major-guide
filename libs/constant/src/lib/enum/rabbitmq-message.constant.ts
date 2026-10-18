// đặt tên pattern theo enum của service nhận (consumer)

export enum MAIL_SERVICE_RABBIT_MESSAGE {
    CONTACT_MAIL = 'mail.contact_mail',
    SEND_EINVOICE = 'mail.send_einvoice',
    SEND_ADMIN_EMAIL = 'mail.send_admin_email'
}

export enum BOOKING_SERVICE_RABBIT_MESSAGE {
    BOOKING_ADD_RESERVE = 'booking.booking_add_reverse',
    BOOKING_CHECK_REVERSE = 'booking.booking_check_reserve',
    BOOKING_SUCCESS_STATUS = 'booking.booking_success_status'
    // BOOKING_
}
