import { Request } from 'express';
import { Role } from 'src/modules/auth/entities/enums';

export interface RequestWithUser extends Request {
    user: {
        id: string;
        email: string;
        role: Role;
        organizationId?: string; // Propiedad organizationId agregada
    };
}
