import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHistoryDto } from './dto/create-history.dto';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.history.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.history.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const history = await this.prisma.history.findUnique({ where: { id } });

    if (!history) {
      throw new NotFoundException('History tidak ditemukan');
    }

    if (history.userId !== userId) {
      throw new ForbiddenException('Akses ditolak');
    }

    return history;
  }

  async create(userId: string, dto: CreateHistoryDto) {
    return this.prisma.history.create({
      data: {
        userId,
        imageUrl: dto.imageUrl,
        detectedFoods: dto.detectedFoods,
        nutritionResult: dto.nutritionResult,
      },
    });
  }

  async delete(id: string, userId: string) {
    const history = await this.findOne(id, userId);

    await this.prisma.history.delete({ where: { id: history.id } });

    return { message: 'History berhasil dihapus' };
  }

  async getStats(userId: string) {
    const totalScans = await this.prisma.history.count({ where: { userId } });
    const recentScans = await this.prisma.history.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      totalScans,
      recentScans,
    };
  }
}
