import { Role } from "../entities/enums";

export class OrganizationMemberDto {
    id: string;
    email: string;
    name: string | null;
    bio: string | null;
    avatarUrl: string | null;
    role: Role;
    is_active: boolean;
    createdAt: Date;
    testimonioCount?: number;
}
