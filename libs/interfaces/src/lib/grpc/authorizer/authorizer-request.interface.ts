import { Observable } from "rxjs";
import { AuthorizerResponse } from "./authorizer-response.interface";

export class VerifyTokenRequest {
    token: string;
    processId: string;
}

export interface AuthorizerService {
    verifyUserToken(tmp: VerifyTokenRequest): Observable<AuthorizerResponse>
}