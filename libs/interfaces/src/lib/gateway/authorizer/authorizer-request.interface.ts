import { User } from "@common/schemas/user-access/user.schema";
import { JwtPayload } from 'jsonwebtoken';

export class MetaDataOfAuThorizer {
    jwt: JwtPayload;
    user: User;
    userId: string;
}

export class AuthorizerResponse {
    valid: boolean;
    metadata: MetaDataOfAuThorizer;
}