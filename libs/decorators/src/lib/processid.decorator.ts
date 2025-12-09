
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { MetaDataKeys } from '@common/constant/common.constant';
import { getProcessId } from '@common/utils/string.util';

export const ProcessId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext,) => {
        const request = ctx.switchToHttp().getRequest();
        const processId = request[MetaDataKeys.PROCESS_ID];
        return processId || getProcessId()
    },
);
