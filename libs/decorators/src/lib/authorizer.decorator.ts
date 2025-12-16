import { MetaDataKeys } from "@common/constant/common.constant"
import { applyDecorators, SetMetadata } from "@nestjs/common"
import { ApiBearerAuth } from '@nestjs/swagger'

// Custom decorator dùng để gắn metadata (SECURED)
// Metadata này được đọc lại bằng Reflector (vd: trong Guard)
// Decorator gắn metadata SECURED để xác định route có yêu cầu authorization hay không
export const Authorization = ({ secured = false }: { secured?: boolean }) => {
    const setMetadata = SetMetadata(MetaDataKeys.SECURED, { secured: secured });

    if (secured) {
        const decorator = [ApiBearerAuth()];
        return applyDecorators(...decorator, setMetadata)
    }

    return setMetadata

}