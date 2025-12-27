export const convertTimeToInteger = (time: string) => {
    const tmp = time.split(':');
    const tmp1: number = Number(tmp[0]) * 60 + Number(tmp[1])
    return tmp1
}


export const getCurrentWeek = (date = new Date()) => {
    const current = new Date(date);
    const day = current.getDay(); // 0 (CN) -> 6 (T7)

    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(current);
    monday.setDate(current.getDate() + diff);

    // Lấy 7 ngày trong tuần
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}