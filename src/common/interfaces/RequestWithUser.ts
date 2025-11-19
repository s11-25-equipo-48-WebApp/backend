import { Role } from "../entities/enums";
import { Request } from 'express';

export interface RequestWithUser extends Request {
    user: {
        id: string;
        email: string;
        role: Role;
    };
}