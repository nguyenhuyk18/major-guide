import { LEVEL_USER } from "@common/constant/enum/level-user.constant";

export class UpdateExpertInfoTcp {
    teachAt?: string;
    information?: string;
    major?: string;
    level?: LEVEL_USER;
    price?: number;
}

export class UpdateMemberInfoTcp {
    highSchool?: string;
}

export class UpdateUserRequestTcp {
    userId: string;  // ID của user cần update
    name?: string;
    wardId?: string;
    expertProfile?: UpdateExpertInfoTcp;
    memberProfile?: UpdateMemberInfoTcp;
}
