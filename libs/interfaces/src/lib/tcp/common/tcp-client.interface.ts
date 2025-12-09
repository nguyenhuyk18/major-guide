import { Observable } from "rxjs";
import { RequestType } from "./request-tcp.interface";
import { ResponseType } from "./response-tcp.interface";

export interface TcpClient {

    send<TResult = any, TInput = any>(pattern: any, data: RequestType<TInput>): Observable<ResponseType<TResult>>;
    emit<TResult = any, TInput = any>(pattern: any, data: RequestType<TInput>): Observable<ResponseType<TResult>>;
}

