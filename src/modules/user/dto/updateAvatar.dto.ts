import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UpdateAvatarDto {
  @ApiProperty({
    description: 'URL del avatar',
    required: false,
    example: 'https://example.com/avatar.png',
  })
  @IsString()
  avatar_url?: string;
}