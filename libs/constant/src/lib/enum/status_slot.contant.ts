export enum STATUS_SLOT {
    // đã có người giữ chỗ
    HOLDING = 'holding',
    // lịch này kh vấn đề gì
    AVAILABLE = 'available',
    // lịch này chuyên gia bận
    CANCLE = 'cancle',
    // đã đặt bởi ai đó
    ORDERED = 'ordered'
}


export enum STATUS_BOOKING {
    RESERVED = 'reserved',
    PAIED = 'paied',
    // booking này lỏ nên hủy
    CANCLE = 'cancle',
    FAILED = 'failed'
}