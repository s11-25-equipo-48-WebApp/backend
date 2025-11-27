import { Request } from 'express';
import { Role } from 'src/modules/organization/entities/enums';

export interface RequestWithUser extends Request {
    user: {
        id: string;
        email: string;
        organizations: { // Ahora es un array de organizaciones
            id: string;
            name: string;
            role: Role;
        }[];
    };
}
