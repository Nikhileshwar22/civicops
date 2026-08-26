import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './app.config';
import databaseConfig from './database.config';
import redisConfig from './redis.config';
import jwtConfig from './jwt.config';
import storageConfig from './storage.config';
import aiConfig from './ai.config';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    ConfigModule.forFeature(databaseConfig),
    ConfigModule.forFeature(redisConfig),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(storageConfig),
    ConfigModule.forFeature(aiConfig),
  ],
})
export class ConfigurationModule {}
