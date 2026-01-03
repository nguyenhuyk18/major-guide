import { User } from "@common/schemas/user-access/user.schema";
import { JwtPayload } from 'jsonwebtoken';
// import { ObjectId } from "mongodb";

export class MetaDataOfAuThorizer {
    jwt: JwtPayload;
    user: Partial<User>;
    userId: string;
}

export class AuthorizerResponse {
    valid: boolean;
    metadata: MetaDataOfAuThorizer;
}