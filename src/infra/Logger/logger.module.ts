import { Module, Global } from '@nestjs/common';
import { PinoLogger } from './logger.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PinoLogger],
  exports: [PinoLogger],
})
export class LoggerModule {}
