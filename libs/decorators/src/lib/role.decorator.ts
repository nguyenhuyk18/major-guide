import { Reflector } from '@nestjs/core';
import { ROLE } from '@common/constant/enum/action.constant';

export const Roles = Reflector.createDecorator<ROLE[]>();
