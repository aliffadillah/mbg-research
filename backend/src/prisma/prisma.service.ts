import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async onModuleInit() {
    const parsedRetries = Number.parseInt(process.env.PRISMA_CONNECT_RETRIES ?? '', 10);
    const parsedDelay = Number.parseInt(process.env.PRISMA_CONNECT_RETRY_DELAY_MS ?? '', 10);
    const maxRetries = Number.isFinite(parsedRetries) && parsedRetries > 0 ? parsedRetries : 5;
    const baseDelayMs = Number.isFinite(parsedDelay) && parsedDelay > 0 ? parsedDelay : 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();

        if (attempt > 1) {
          this.logger.log(`Prisma connected on attempt ${attempt}/${maxRetries}.`);
        }

        return;
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        const isLastAttempt = attempt === maxRetries;

        this.logger.error(`Prisma connection attempt ${attempt}/${maxRetries} failed: ${reason}`);

        if (isLastAttempt) {
          this.logger.error(
            'Database is unreachable. Verify DATABASE_URL and include sslmode=require when using Supabase.',
          );
          throw error;
        }

        await this.sleep(baseDelayMs * attempt);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
