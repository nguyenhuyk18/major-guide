export enum TCP_SLOT_SERVICE_MESSAGE {
    GET_ALL_SLOT = 'slot.get_all_shift',
    GET_SLOT_BY_ID = 'slot.get_by_id',
    CREATE_REGISTER_EXPERT = 'slot.create_register_expert',
    GET_REGISTER_BY_ID_EXPERT = 'slot.get_register_by_id_expert',
    GET_SHIFT_IN_DAY = 'slot.get_shift_in_day',
    GET_SHIFT_IN_DAY_BY_ID = 'slot.get_shift_in_day_by_id',
}

export enum TCP_USER_ACCESS_SERVICE_MESSAGE {
    GET_ALL_PROVINCE = 'useraccess.get_all_province',
    GET_PROVINCE_BY_ID = 'useraccess.get_province_by_id',
    GET_ALL_WARD = 'useraccess.get_all_ward',
    GET_WARD_BY_ID = 'useraccess.get_ward_by_id',
    CREATE_NEW_USER = 'useraccess.create_new_user',
    GET_USER_BY_ID = 'useraccess.get_user_by_id',
    UPDATE_AVATAR_USER = 'useraccess.update_avatar_user'
}

export enum TCP_MEDIA_SERVICE_MESSAGE {
    UPLOAD_AVARTAR_USER = 'media.upload_avartar_user'
}


export enum TCP_AUTHORIZER_SERVICE_MESSAGE {
    CREATE_USER = 'authorizer.register_user',
    LOGIN_USER = 'authorizer.login',
    VERIFY_USER = 'autrhorizer.verify_user'
}

