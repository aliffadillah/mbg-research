import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';

@Injectable()
export class DetectionService {
  private readonly logger = new Logger(DetectionService.name);
  private readonly transformerUrl: string;

  constructor(private readonly config: ConfigService) {
    const base = (
      this.config.get<string>('TRANSFORMER_API_URL') || 'http://127.0.0.1:3002'
    ).replace(/\/+$/, '');
    this.transformerUrl = base.toLowerCase().endsWith('/estimate')
      ? base
      : `${base}/estimate`;
  }

  async analyze(
    file: Express.Multer.File,
    extras?: Record<string, string>,
  ): Promise<{ data: any; status: number }> {
    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    if (extras) {
      for (const [key, value] of Object.entries(extras)) {
        if (value !== undefined && value !== null && value !== '') {
          form.append(key, value);
        }
      }
    }

    this.logger.log(
      `Forwarding ${file.originalname} (${file.size} bytes) → ${this.transformerUrl}`,
    );

    try {
      const response = await fetch(this.transformerUrl, {
        method: 'POST',
        headers: form.getHeaders(),
        body: new Uint8Array(form.getBuffer()),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        this.logger.error(
          `Transformer returned non-JSON (${response.status}): ${text.slice(0, 200)}`,
        );
        return {
          data: { error: 'Transformer API mengembalikan response tidak valid' },
          status: 502,
        };
      }

      const data = await response.json();

      if (!response.ok) {
        this.logger.warn(
          `Transformer error ${response.status}: ${JSON.stringify(data).slice(0, 300)}`,
        );
        return { data, status: response.status };
      }

      return { data, status: 200 };
    } catch (error) {
      this.logger.error(`Transformer request failed: ${error}`);
      return {
        data: {
          error: 'Tidak dapat terhubung ke Transformer API',
          details: String(error),
        },
        status: 502,
      };
    }
  }
}
