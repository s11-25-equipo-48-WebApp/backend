import { Injectable, BadRequestException, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { In, Repository } from 'typeorm';
import { TestimonioRepository } from './repository/testimonio.repository';
import { CreateTestimonioDto } from './dto/create-testimonio.dto';
import { Testimonio } from './entities/testimonio.entity';
import { UpdateTestimonioDto } from './dto/update-testimonio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { RequestWithUser } from 'src/common/interfaces/RequestWithUser';
import { UpdateStatusDto } from './dto/update-status.dto';
import { GetTestimoniosQueryDto } from './dto/get-testimonios-query.dto';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Tag } from 'src/modules/tags/entities/tag.entity';
//import { Role, Status } from '../auth/entities/enums';
import { Organization } from 'src/modules/organization/entities/organization.entity';
import { OrganizationUser } from '../organization/entities/organization_user.entity';
import { Role, Status } from '../organization/entities/enums';

@Injectable()
export class TestimoniosService {
    constructor(
        private readonly repo: TestimonioRepository,
        @InjectRepository(AuditLog)
        private readonly auditRepo: Repository<AuditLog>,
        @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
        @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
        @InjectRepository(Organization) private readonly organizationRepo: Repository<Organization>,
        @InjectRepository(OrganizationUser) private readonly organizationUserRepo: Repository<OrganizationUser>,
    ) { }

    /**
     * Crea un testimonio.
     * Estado inicial: 'pending'.
     */
    async create(dto: CreateTestimonioDto, user: RequestWithUser['user'], organizationId: string): Promise<Testimonio> {
        const userOrg = user.organizations.find(org => org.id === organizationId);
        if (!user || !userOrg) {
            throw new UnauthorizedException('No autorizado para crear testimonios en esta organización.');
        }

        const organization = await this.organizationRepo.findOneBy({ id: organizationId });
        if (!organization) {
            throw new BadRequestException(`Organización con ID ${organizationId} no encontrada.`);
        }

        // validar/obtener categoría, asegurándose de que pertenezca a la organización
        const category = await this.categoryRepo.findOne({
            where: { id: dto.category_id, organization: { id: organizationId } }
        });
        if (!category) throw new BadRequestException(`Category ${dto.category_id} not found or does not belong to this organization`);

        // validar/obtener tags, asegurándose de que pertenezcan a la organización
        const tags = dto.tags && dto.tags.length > 0
            ? await this.tagRepo.find({
                where: { id: In(dto.tags), organization: { id: organizationId } }
            })
            : [];

        if (dto.tags && tags.length !== dto.tags.length) {
            throw new BadRequestException('One or more tags not found');
        }

        const entity = this.repo.create({
            id: uuidv4(),
            title: dto.title,
            body: dto.body,
            category,
            tags,
            media_url: dto.media_url ?? null,
            media_type: dto.media_type,
            author_id: user?.id ?? null,
            organization: organization, // Asociar el testimonio con la organización
        });

        // Lógica para determinar el estado inicial del testimonio
        // userOrg ya está definido al inicio del método
        const isAdminOrSuperAdmin = userOrg.role === Role.ADMIN || userOrg.role === Role.SUPERADMIN;
        entity.status = isAdminOrSuperAdmin ? Status.APROBADO : Status.PENDIENTE;

        // Si se aprueba automáticamente, establecer approved_by y approved_at
        if (entity.status === Status.APROBADO) {
            entity.approved_by = user.id;
            entity.approved_at = new Date();
        }

        return this.repo.save(entity);
    }


    /**
     * Actualiza un testimonio:
     * - Solo autor (author_id) o admin pueden editar.
     * - Registra audit_log con diff antes/después.
     */
    async update(
        id: string,
        dto: UpdateTestimonioDto,
        user: RequestWithUser['user'],
        organizationId: string, // Añadir organizationId
    ): Promise<Testimonio> {
        const userOrg = user.organizations.find(org => org.id === organizationId);
        // Buscar testimonio y validar organización
        if (!user || !userOrg) {
            throw new UnauthorizedException('No autorizado para editar testimonios en esta organización.');
        }

        const existing = await this.repo.findOneById(id, organizationId); // Usar organizationId para buscar
        if (!existing) {
            throw new NotFoundException(`Testimonio con ID ${id} no encontrado en su organización.`);
        }

        // Validar usuario presente
        if (!user) {
            throw new ForbiddenException('Authentication required to edit testimonio');
        }

        // userOrg ya está definido al inicio del método
        const isAdmin = userOrg.role === Role.ADMIN || userOrg.role === Role.SUPERADMIN; // Incluir superadmin
        const isAuthor = existing.author_id === user.id;

        // Permisos: autor, admin o superadmin
        if (!isAdmin && !isAuthor) {
            throw new ForbiddenException(
                'Only the author, an admin or superadmin can edit this testimonio',
            );
        }

        // Campos permitidos a editar
        const editable: Array<keyof UpdateTestimonioDto> = [
            'title',
            'body',
            'category_id',
            'tags',
            'media_url',
        ];

        // Construcción del diff
        const diff: Record<string, { before: any; after: any }> = {};
        let anyChange = false;

        for (const field of editable) {
            const newValue = dto[field];
            if (newValue === undefined) continue;

            // valor previo
            // @ts-ignore
            const before = existing[field];
            const after = newValue;

            if (this._valuesDiffer(before, after)) {
                anyChange = true;
                diff[field] = { before, after };

                // aplicar cambio en entity
                // @ts-ignore
                existing[field] = after;
            }
        }

        // Si no hubo cambios, regresar sin escribir audit log
        if (!anyChange) return existing;

        // Guardar testimonio
        const saved = await this.repo.save(existing);

        // Registrar auditoría
        const audit = this.auditRepo.create({
            id: uuidv4(),
            testimonio_id: id,
            user_id: user.id,
            user_name: user.email,
            diff: diff,
            created_at: new Date(),
        });

        await this.auditRepo.save(audit);

        return saved;
    }

    /**
     * Compara valores (incluye arrays y objetos)
     */
    private _valuesDiffer(a: any, b: any): boolean {
        const na = a === undefined ? null : a;
        const nb = b === undefined ? null : b;

        // Comparación de arrays u objetos → JSON
        if (Array.isArray(na) || Array.isArray(nb) || typeof na === 'object' || typeof nb === 'object') {
            return JSON.stringify(na) !== JSON.stringify(nb);
        }

        return na !== nb;
    }


    /**
  * Cambia el estado de un testimonio respetando las reglas:
   * - Solo admin puede cambiar estado.
  */
    async updateStatus(
        id: string,
        dto: UpdateStatusDto,
        user: RequestWithUser['user'],
        organizationId: string, // Añadir organizationId
    ): Promise<Testimonio> {
        const userOrg = user.organizations.find(org => org.id === organizationId);
        // buscar testimonio
        if (!user || !userOrg) {
            throw new UnauthorizedException('No autorizado para cambiar el estado de testimonios en esta organización.');
        }
        const existing = await this.repo.findOneById(id, organizationId); // Usar organizationId para buscar
        if (!existing) {
            throw new NotFoundException(`Testimonio con id ${id} no encontrado en su organización.`);
        }

        // validar usuario
        if (!user) {
            throw new ForbiddenException('Autenticación requerida');
        }

        // validar rol
        // userOrg ya está definido al inicio del método
        const userOrganizationRole = userOrg.role;
        const isAdmin = userOrganizationRole === Role.ADMIN;

        if (!isAdmin) {
            throw new ForbiddenException('Solo un administrador puede cambiar el estado');
        }

        // obtener estados previos y nuevos 
        const prevStatus = existing.status as Status;
        const newStatus = dto.status as Status;

        // si no cambia nada, devolver tal cual
        if (prevStatus === newStatus) {
            return existing;
        }

        // REGLAS DE TRANSICIÓN
        switch (prevStatus) {
            case Status.PENDIENTE:
                // pendiente → aprobado | rechazado
                if (newStatus === Status.APROBADO || newStatus === Status.RECHAZADO) {
                    // permitido
                } else {
                    throw new BadRequestException(
                        `No se puede cambiar estado de pendiente a ${newStatus}`,
                    );
                }
                break;

            case Status.RECHAZADO:
                // rechazado → pendiente (solo admin)
                if (newStatus === Status.PENDIENTE) {
                    if (!isAdmin) {
                        throw new ForbiddenException(
                            'Solo un admin  puede mover rechazado → pendiente',
                        );
                    }
                } else if (newStatus === Status.APROBADO) {
                    // rechazado → aprobado (solo admin)
                    if (!isAdmin) {
                        throw new ForbiddenException(
                            'Solo un admin puede mover rechazado → aprobado',
                        );
                    }
                } else {
                    throw new BadRequestException(
                        `Transición no válida: rechazado → ${newStatus}`,
                    );
                }
                break;

            case Status.APROBADO:
                // aprobado → rechazado (solo admin)
                if (newStatus === Status.RECHAZADO) {
                    if (!isAdmin) {
                        throw new ForbiddenException(
                            'Solo admin puede mover aprobado → rechazado',
                        );
                    }
                } else {
                    throw new BadRequestException(
                        `Transición no válida desde aprobado → ${newStatus}`,
                    );
                }
                break;
        }

        // generar diff
        const diff: Record<string, { before: any; after: any }> = {};
        diff['status'] = { before: prevStatus, after: newStatus };

        const beforeApprovedBy = existing.approved_by ?? null;
        const beforeApprovedAt = existing.approved_at ?? null;

        // si pasa a aprobado o rechazado → asignar aprobado por
        if (newStatus === Status.APROBADO || newStatus === Status.RECHAZADO) {
            existing.approved_by = user.id;
            existing.approved_at = new Date();
            diff['approved_by'] = { before: beforeApprovedBy, after: user.id };
            diff['approved_at'] = { before: beforeApprovedAt, after: existing.approved_at };
        }

        // si vuelve a pendiente → limpiar campos
        if (newStatus === Status.PENDIENTE) {
            existing.approved_by = null;
            existing.approved_at = null;
            diff['approved_by'] = { before: beforeApprovedBy, after: null };
            diff['approved_at'] = { before: beforeApprovedAt, after: null };
        }

        // aplicar estado
        existing.status = newStatus;

        // guardar
        const saved = await this.repo.save(existing);

        // audit log
        const audit: AuditLog = this.auditRepo.create({
            id: uuidv4(),
            testimonio_id: id,
            user_id: user.id,
            user_name: user.email,
            diff,
            created_at: new Date(),
        });

        await this.auditRepo.save(audit);

        return saved;
    }


    /**
    * Soft delete de un testimonio:
    * - Sólo admin (o superadmin) puede eliminar.
    * - Marca deleted_at.
    * - Registra audit_log con diff (before/after).
    */
    async softDelete(id: string, user: RequestWithUser['user'], organizationId: string): Promise<{ id: string; deleted_at: Date }> {
        const userOrg = user.organizations.find(org => org.id === organizationId);
        //  buscar (ya excluye borrados)
        if (!user || !userOrg) {
            throw new UnauthorizedException('No autorizado para eliminar testimonios en esta organización.');
        }
        const existing = await this.repo.findOneById(id, organizationId); // Usar organizationId para buscar
        if (!existing) {
            throw new NotFoundException(`Testimonio con id ${id} no encontrado en su organización.`);
        }

        // validar usuario
        if (!user) {
            throw new ForbiddenException('Autenticación requerida');
        }

        // sólo admin puede eliminar (según criterio)
        // userOrg ya está definido al inicio del método
        const userOrganizationRole = userOrg.role;
        const isAdmin = userOrganizationRole === Role.ADMIN;
        if (!isAdmin) {
            throw new ForbiddenException('Solo administradores pueden eliminar testimonios');
        }

        // si ya tiene deleted_at (debería no llegar por findOneById), rechazamos
        if (existing.deleted_at) {
            // aunque findOneById ya excluye borrados, dejamos esta comprobación defensiva
            throw new NotFoundException(`Testimonio con id ${id} no encontrado`);
        }

        // construir diff (antes/after)
        const beforeDeletedAt = null;
        const afterDeletedAt = new Date();

        const diff: Record<string, { before: any; after: any }> = {
            deleted_at: { before: beforeDeletedAt, after: afterDeletedAt },
        };

        // marcar deleted_at y guardar
        existing.deleted_at = afterDeletedAt;
        const saved = await this.repo.softDelete(existing);

        // registrar audit_log
        const audit = this.auditRepo.create({
            id: uuidv4(),
            testimonio_id: id,
            user_id: user.id,
            user_name: user.email,
            diff,
            created_at: new Date(),
        });
        await this.auditRepo.save(audit);

        //respuesta: id y deleted_at
        return { id: saved.id, deleted_at: saved.deleted_at! };
    }

    async findPublic(query: GetTestimoniosQueryDto): Promise<{ data: Testimonio[]; meta: { total: number; page: number; limit: number; totalPages: number; }; }> {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 20;

        const [items, total] = await this.repo.findPublicWithFilters({
            category_id: query.category_id,
            tag_id: query.tag_id,
            organization_id: query.organization_id,
            page,
            limit,
        });

        return {
            data: items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

}
