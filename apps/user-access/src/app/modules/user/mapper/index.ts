import { AvartarDefault } from "@common/constant/common.constant";
import { LEVEL_USER } from "@common/constant/enum/level-user.constant";
import { UserRequestTcp } from "@common/interfaces/tcp/user";
import { User } from "@common/schemas/user-access/user.schema";
import { ObjectId } from 'mongodb';
import { cleanCareerFamilies, inferCareerFamilies } from "../../career-assessment/expert-matching";

export const mapperCreateUser = (data: UserRequestTcp): Partial<User> => {
    if (data.isExpert) {
        return {
            username: data.username,
            name: data.firstname + ' ' + data.lastname,
            email: data.email,
            wardId: new ObjectId(data.ward_id),
            fileAvartarUrl: AvartarDefault.AVARTAR_DEFAULT,
            userId: data.user_id,
            roleName: data.role_name,
            expertProfile: {
                information: data.expertProfile.information,
                level: data.expertProfile.level as LEVEL_USER,
                major: data.expertProfile.major,
                teachAt: data.expertProfile.teachAt,
                price: data.expertProfile.price,
                // Families picked by the admin, else inferred from the major so the expert can be recommended.
                careerFamilies: cleanCareerFamilies(data.expertProfile.careerFamilies).length
                    ? cleanCareerFamilies(data.expertProfile.careerFamilies)
                    : inferCareerFamilies(data.expertProfile.major, data.expertProfile.teachAt, data.expertProfile.information)
            },

        }
    }
    else {
        return {
            username: data.username,
            name: data.firstname + ' ' + data.lastname,
            email: data.email,
            wardId: new ObjectId(data.ward_id),
            fileAvartarUrl: AvartarDefault.AVARTAR_DEFAULT,
            userId: data.user_id,
            roleName: data.role_name,
            memberProfile: {
                highSchool: data.memberProfile.highSchool
            }
        }
    }

}