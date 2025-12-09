import { getProcessId } from '@common/utils/string.util';
export class RequestTcp<T> {
    processId: string;
    data?: T

    constructor(data?: Partial<RequestTcp<T>>) {
        this.data = data?.data;
        this.processId = data?.processId || getProcessId();
    }
}

export type RequestType<T> = RequestTcp<T>