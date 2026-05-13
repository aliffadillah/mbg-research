import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { HistoryModule } from './modules/history/history.module';
import { DetectionModule } from './modules/detection/detection.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    NutritionModule,
    HistoryModule,
    DetectionModule,
  ],
})
export class AppModule {}
