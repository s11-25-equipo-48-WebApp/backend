import { Role } from 'src/modules/auth/entities/enums';

export class OrganizationMemberDto {
    id: string;
    email: string;
    name: string | null;
    bio: string | null;
    avatarUrl: string | null;
    role: Role;
    is_active: boolean;
    createdAt: Date;
}
