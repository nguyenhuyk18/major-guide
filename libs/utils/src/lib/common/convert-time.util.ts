export const convertTimeToInteger = (time: string) => {
    const tmp = time.split(':');
    const tmp1: number = Number(tmp[0]) * 60 + Number(tmp[1])
    return tmp1
}