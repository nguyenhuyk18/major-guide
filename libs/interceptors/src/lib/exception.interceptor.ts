import { CallHandler, ExecutionContext, HttpException, HttpStatus, Logger, NestInterceptor } from '@nestjs/common'
import { catchError, map, Observable } from 'rxjs';
import { Request } from 'express';
import { MetaDataKeys } from '@common/constant/common.constant';
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { HTTP_MESSAGE } from '@common/constant/enum/http-message.constant';

export class ExceptionInterceptor implements NestInterceptor {
    private readonly logger = new Logger(ExceptionInterceptor.name)

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> | Promise<Observable<any>> {
        // throw new Error('Method not implemented.')
        const ctx = context.switchToHttp();
        const request: Request & { [MetaDataKeys.PROCESS_ID]: string;[MetaDataKeys.START_TIME]: number } = ctx.getRequest();

        const processID = request[MetaDataKeys.PROCESS_ID];
        const startTime = request[MetaDataKeys.START_TIME];

        return next.handle().pipe(map((data: ResponseDto<unknown>) => {
            const durationMs = Date.now() - startTime;
            data.processID = processID;
            data.duration = `${durationMs} ms`;
            return data;
        }),
            catchError((error) => {
                this.logger.error({ error });
                const durationMs = Date.now() - startTime;
                const message = error?.response?.message || error?.message || error || HTTP_MESSAGE.INTERNAL_SERVER_ERROR;

                const code = error?.code || error?.statusCode || error?.response?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR

                throw new HttpException(new ResponseDto({ data: null, message, statusCode: code, duration: `${durationMs} ms`, processID: processID }), code)
            }),
        );
    }
}