import { Request } from 'express';
import { Role } from 'src/modules/organization/entities/enums';

export interface RequestWithUser extends Request {
    user: {
        id: string;
        email: string;
        organization?: {
            id: string;
            name?: string;
            role: Role;
        };
    };
}
