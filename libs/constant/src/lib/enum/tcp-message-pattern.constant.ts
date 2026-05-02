export enum TCP_SLOT_SERVICE_MESSAGE {
    GET_ALL_REGISTER = 'slot.get_all_register',
    GET_ALL_SLOT = 'slot.get_all_shift',
    GET_SLOT_BY_ID = 'slot.get_by_id',
    CREATE_REGISTER_EXPERT = 'slot.create_register_expert',
    GET_REGISTER_BY_ID_EXPERT = 'slot.get_register_by_id_expert',
    GET_SHIFT_IN_DAY = 'slot.get_shift_in_day',
    GET_SHIFT_IN_DAY_WITHOUT_COUNT = 'slot.get_shift_in_day_without_count',
    GET_SHIFT_IN_DAY_BY_ID = 'slot.get_shift_in_day_by_id',
    APPROVE_THE_REGISTER = 'slot.approve_the_register',
    CANCLE_THE_REGISTER = 'slot.cancle_the_register',
    GET_REGISTER_BY_ID = 'slot.get_register_by_id',
    GET_SHIFT_DAILY_SLOT = 'slot.get_shift_daily_slot',
    GET_SHIFT_IN_DAY_BY_ID_REAL = 'slot.get_shift_in_day_by_id_real'
}

export enum TCP_USER_ACCESS_SERVICE_MESSAGE {
    GET_ALL_PROVINCE = 'useraccess.get_all_province',
    GET_PROVINCE_BY_ID = 'useraccess.get_province_by_id',
    GET_ALL_WARD = 'useraccess.get_all_ward',
    GET_WARD_BY_ID = 'useraccess.get_ward_by_id',
    CREATE_NEW_USER = 'useraccess.create_new_user',
    GET_USER_BY_ID = 'useraccess.get_user_by_id',
    UPDATE_AVATAR_USER = 'useraccess.update_avatar_user',
    UPDATE_USER_PROFILE = 'useraccess.update_user_profile',
    GET_USER_BY_IDS = 'useraccess.get_user_by_ids',
    CONTACT_TO_SUPPORT = 'useraccess.contact_to_support',
    GET_ALL_USER = 'useraccess.get_all_user',
    GET_WARD_BY_ID_PROVINCE = 'useraccess.get_ward_by_id_province'
}

export enum TCP_MEDIA_SERVICE_MESSAGE {
    UPLOAD_AVARTAR_USER = 'media.upload_avartar_user',
    UPLOAD_PDF = 'media.upload_pdf'
}


export enum TCP_AUTHORIZER_SERVICE_MESSAGE {
    CREATE_USER = 'authorizer.register_user',
    LOGIN_USER = 'authorizer.login',
    VERIFY_USER = 'autrhorizer.verify_user'
}


export enum TCP_CHAT_SERVICE_MESSAGE {
    SAVE_MESSAGE_COMMUNITY = 'chat.save_message_community',
    GET_ALL_MESSAGE_COMMUNITY = 'chat.get_all_message_community',
    GET_MESSAGE_COMMUNITY_BY_ID = 'chat.get_message_community_by_id'
}


export enum TCP_BOOKING_SERVICE_MESSAGE {
    SAVE_REVERSE = 'booking.save_reserve',
    CREATE_LINK_PAYMENT = 'booking.create_link_payment',
    CONFIRM_PAYMENT_BOOKING = 'booking.confirm_payment_booking',
    GET_BOOKING_BY_MEMBER = 'booking.get_booking_by_member',
    CREATE_BOOKING = 'booking.create_booking',
    GET_BOOKING_BY_EXPERT = 'booking.get_booking_by_expert'
}