import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DetectionService } from './detection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('detection')
@UseGuards(JwtAuthGuard)
export class DetectionController {
  constructor(private readonly detectionService: DetectionService) {}

  @Post('analyze')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async analyze(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
    @Res() res: Response,
  ) {
    if (!file) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: "File tidak ditemukan. Gunakan field 'file'.",
      });
    }

    const extras: Record<string, string> = {};
    for (const key of ['doneness', 'doneness_label', 'doneness_score', 'doneness_per_class', 'doneness_from_image']) {
      if (body[key] !== undefined) {
        extras[key] = body[key];
      }
    }

    const { data, status } = await this.detectionService.analyze(file, extras);
    return res.status(status).json(data);
  }
}
