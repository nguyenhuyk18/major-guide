import { AvartarDefault } from "@common/constant/common.constant";
import { LEVEL_USER } from "@common/constant/enum/level-user.constant";
import { UserRequestTcp } from "@common/interfaces/tcp/user";
import { User } from "@common/schemas/user-access/user.schema";
import { ObjectId } from 'mongodb';

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
                teachAt: data.expertProfile.teachAt
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