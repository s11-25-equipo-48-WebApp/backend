import { Module } from '@nestjs/common';
import { TestingController } from './testing.controller';
import { TestingService } from './testing.service';
import { JwtStrategy } from 'src/jwt/jwt.strategy';

@Module({
  controllers: [TestingController],
  providers: [TestingService, JwtStrategy],
})
export class TestingModule {}
