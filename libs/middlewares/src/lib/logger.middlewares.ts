import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getProcessId } from '@common/utils/string.util';
import { MetaDataKeys } from '@common/constant/common.constant'


@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // console.log('Request...');
        const startTime = Date.now();
        const { method, originalUrl, body } = req;

        const processId = getProcessId();
        const now = Date.now();

        (req as any)[MetaDataKeys.PROCESS_ID] = processId;
        (req as any)[MetaDataKeys.START_TIME] = startTime;

        Logger.log(`HTTP >> Start Process '${processId}' >> path: '${originalUrl}' >> method: '${method}' >> at: '${now}'  >> input: '${JSON.stringify(body)}'`);


        const originalSend = res.send.bind(res);

        res.send = (body: any) => {
            const durationMs = Date.now() - startTime;
            Logger.log(`HTTP >> End Process '${processId}' >> path: '${originalUrl}' >> method: '${method}' >> at: '${now}' >> duration: ${durationMs} ms`);
            return originalSend(body);
        }

        next();
    }
}