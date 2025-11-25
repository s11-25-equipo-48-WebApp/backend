import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
//import { Role } from '../common/entities/enums';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TestingService } from './testing.service';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { Role } from './entities/enums';

@ApiTags('testing')
@Controller('testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Get('public')
  getPublicData(): string {
    return this.testingService.getPublicData();
  }

  @Get('visitor')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VISITOR, Role.EDITOR, Role.ADMIN, Role.SUPERADMIN)
  getVisitorData(@Req() req): string {
    return this.testingService.getProtectedData(req.user, 'Visitor');
  }

  @Get('editor')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN, Role.SUPERADMIN)
  getEditorData(@Req() req): string {
    return this.testingService.getProtectedData(req.user, 'Editor');
  }

  @Get('admin')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  getAdminData(@Req() req): string {
    return this.testingService.getProtectedData(req.user, 'Admin');
  }

  @Get('superadmin')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  getSuperAdminData(@Req() req): string {
    return this.testingService.getProtectedData(req.user, 'SuperAdmin');
  }
}
