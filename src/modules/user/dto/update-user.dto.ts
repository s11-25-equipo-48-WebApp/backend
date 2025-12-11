import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsObject } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ 
    example: 'Juan ', 
    description: 'Nombre del usuario', 
    required: false 
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    example: 'Perez', 
    description: 'Apellido del usuario',
    required: false 
  })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ 
    example: 'nuevo.email@example.com', 
    description: 'Correo electrónico del usuario', 
    required: false 
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Campos del perfil (UserProfile)
  @ApiProperty({ 
    example: 'https://ejemplo.com/avatar.jpg', 
    description: 'URL del avatar del usuario', 
    required: false 
  })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  // @ApiProperty({ 
  //   example: 'Desarrollador apasionado por la tecnología', 
  //   description: 'Biografía del usuario', 
  //   required: false 
  // })
  // @IsOptional()
  // @IsString()
  // bio?: string;

  // @ApiProperty({ 
  //   example: { theme: 'dark', notifications: true }, 
  //   description: 'Metadatos adicionales del perfil', 
  //   required: false 
  // })
  // @IsOptional()
  // @IsObject()
  // metadata?: any;
}
