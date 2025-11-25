import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/modules/auth/entities/enums';
//import { Role } from '../entities/enums';


export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
