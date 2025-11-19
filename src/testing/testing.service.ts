import { Injectable } from '@nestjs/common';

@Injectable()
export class TestingService {
  getPublicData(): string {
    return 'Esta es una ruta pública. Cualquiera puede acceder a ella.';
  }

  getProtectedData(user: any, role: string): string {
    return `Hola ${user.email}! Tienes acceso a la ruta de ${role}. Tu rol es ${user.role}.`;
  }
}
