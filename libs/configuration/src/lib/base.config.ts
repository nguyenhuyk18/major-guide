import { IsNotEmpty, IsString, validateSync } from "class-validator";
import { Logger } from "@nestjs/common";

export class BaseConfiguration {

    @IsString()
    @IsNotEmpty()
    GLOBAL_PREFIX: string

    constructor() {
        this.GLOBAL_PREFIX = process.env['GLOBAL_PREFIX'] || 'api/v2'
    }

    validate() {
        const error = validateSync(this);
        if (error.length) {
            const errors = error.map((err) => {
                return err.children;
            })

            Logger.error(errors, error)
            throw new Error('Configuration is invalid !!!')
        }
    }
}