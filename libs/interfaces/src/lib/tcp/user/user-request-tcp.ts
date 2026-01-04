// import { CreateKeyCloakUserRequest } from "../../common/create-user-keyloak-request.interface";
// import { UserRequestDto } from "../../gateway/user";

import { ROLE } from "@common/constant/enum/action.constant";
import { LEVEL_USER } from "@common/constant/enum/level-user.constant";
// import { CreateKeyCloakUserRequest } from "../../common/create-user-keyloak-request.interface";

export class ExpertInfoRequestTcp {

    teachAt?: string


    information?: string


    major?: string


    level?: LEVEL_USER
}

export class MemberInfoTcp {

    highSchool: string

    // @Prop({})
}

export class UserRequestTcp {

    username: string


    firstname: string


    lastname: string



    email: string



    // password: string


    ward_id: string



    role_name: ROLE

    // @IsBoolean() 
    isExpert: boolean;

    user_id: string;

    expertProfile?: ExpertInfoRequestTcp;


    memberProfile?: MemberInfoTcp;
}