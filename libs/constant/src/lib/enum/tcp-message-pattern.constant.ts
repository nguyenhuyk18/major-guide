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
    GET_WARD_BY_ID_PROVINCE = 'useraccess.get_ward_by_id_province',
    UPDATE_STATUS_ACCOUNT = 'useraccess.update_status_account',
    // Question
    GET_ALL_QUESTION = 'useraccess.get_all_question',
    GET_QUESTION_BY_ID = 'useraccess.get_question_by_id',
    CREATE_QUESTION = 'useraccess.create_question',
    CREATE_MANY_QUESTION = 'useraccess.create_many_question',
    UPDATE_QUESTION = 'useraccess.update_question',
    DELETE_QUESTION = 'useraccess.delete_question',
    GET_PUBLISHED_QUESTIONS = 'useraccess.get_published_questions',
    GET_GROUPED_QUESTIONS = 'useraccess.get_grouped_questions',
    // TestResult
    SAVE_TEST_ANSWER = 'useraccess.save_test_answer',
    SUBMIT_TEST_RESULT = 'useraccess.submit_test_result',
    GET_TEST_RESULTS_BY_USER = 'useraccess.get_test_results_by_user',
    GET_LATEST_TEST_RESULT = 'useraccess.get_latest_test_result',
    GET_INPROGRESS_TEST_RESULT = 'useraccess.get_inprogress_test_result',
    GET_ALL_TEST_RESULTS = 'useraccess.get_all_test_results',
    GET_TEST_RESULT_BY_ID = 'useraccess.get_test_result_by_id',
    DELETE_TEST_RESULT = 'useraccess.delete_test_result',
    // Expert review
    CREATE_EXPERT_REVIEW = 'useraccess.create_expert_review',
    UPDATE_EXPERT_REVIEW = 'useraccess.update_expert_review',
    DELETE_EXPERT_REVIEW = 'useraccess.delete_expert_review',
    GET_EXPERT_REVIEWS = 'useraccess.get_expert_reviews',
    GET_EXPERT_REVIEW_SUMMARY = 'useraccess.get_expert_review_summary'
}

export enum TCP_MEDIA_SERVICE_MESSAGE {
    UPLOAD_AVARTAR_USER = 'media.upload_avartar_user',
    UPLOAD_PDF = 'media.upload_pdf',
    UPLOAD_IMAGE = 'media.upload_image',
    CREATE_POST = 'media.create_post',
    UPDATE_POST = 'media.update_post',
    DELETE_POST = 'media.delete_post',
    GET_POST_BY_ID = 'media.get_post_by_id',
    GET_POSTS_BY_EXPERT = 'media.get_posts_by_expert',
    GET_ALL_POSTS = 'media.get_all_posts'
}


export enum TCP_AUTHORIZER_SERVICE_MESSAGE {
    CREATE_USER = 'authorizer.register_user',
    LOGIN_USER = 'authorizer.login',
    VERIFY_USER = 'autrhorizer.verify_user'
}


export enum TCP_CHAT_SERVICE_MESSAGE {
    SAVE_MESSAGE_COMMUNITY = 'chat.save_message_community',
    GET_ALL_MESSAGE_COMMUNITY = 'chat.get_all_message_community',
    GET_MESSAGE_COMMUNITY_BY_ID = 'chat.get_message_community_by_id',
    CREATE_ROOM = 'chat.create_room',
    GET_ROOMS_BY_PARTICIPANT = 'chat.get_rooms_by_participant',
    SEND_PRIVATE_MESSAGE = 'chat.send_private_message',
    GET_PRIVATE_MESSAGES = 'chat.get_private_messages',
    MARK_PRIVATE_ROOM_READ = 'chat.mark_private_room_read'
}


export enum TCP_BOOKING_SERVICE_MESSAGE {
    SAVE_REVERSE = 'booking.save_reserve',
    CREATE_STRIPE_CHECKOUT = 'booking.create_stripe_checkout',
    GET_STRIPE_CHECKOUT_STATUS = 'booking.get_stripe_checkout_status',
    PROCESS_STRIPE_WEBHOOK = 'booking.process_stripe_webhook',
    GET_BOOKING_BY_MEMBER = 'booking.get_booking_by_member',
    CREATE_BOOKING = 'booking.create_booking',
    GET_BOOKING_BY_EXPERT = 'booking.get_booking_by_expert',
    GET_BOOKING_DASHBOARD = 'booking.get_booking_dashboard',
    EXPERT_JOIN_BOOKING = 'booking.expert_join_booking',
    VIDEO_CALL_ACCESS = 'booking.video_call_access'
}
