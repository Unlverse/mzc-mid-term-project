import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GalleryService } from './gallery.service';

const uploadDir =
  process.env.UPLOAD_DIR?.trim() || join(process.cwd(), 'uploads');

function ensureUploadDir() {
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
}

function sanitizeBaseName(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

@Controller()
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('gallery')
  getGalleryImages() {
    return this.galleryService.listImages();
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/gallery/:fileName')
  deleteGalleryImage(@Param('fileName') fileName: string) {
    return this.galleryService.deleteImage(fileName);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/gallery')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          ensureUploadDir();
          callback(null, uploadDir);
        },
        filename: (_request, file, callback) => {
          const extension = extname(file.originalname).toLowerCase();
          const safeBaseName = sanitizeBaseName(file.originalname) || 'gallery';
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

          callback(null, `${safeBaseName}-${uniqueSuffix}${extension}`);
        },
      }),
      fileFilter: (_request, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        const allowedExtensions = new Set([
          '.jpg',
          '.jpeg',
          '.png',
          '.gif',
          '.webp',
          '.avif',
        ]);

        if (!allowedExtensions.has(extension)) {
          callback(
            new BadRequestException('Only image files are allowed.'),
            false,
          );
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  uploadGalleryImage(@UploadedFile() file?: { filename: string }) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    return {
      message: 'Gallery image uploaded successfully.',
      item: {
        name: file.filename,
        url: `/uploads/${encodeURIComponent(file.filename)}`,
      },
    };
  }
}
