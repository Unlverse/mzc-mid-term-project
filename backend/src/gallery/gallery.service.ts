import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { basename, extname, join } from 'path';

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.avif',
]);

@Injectable()
export class GalleryService {
  private readonly uploadDir =
    process.env.UPLOAD_DIR?.trim() || join(process.cwd(), 'uploads');

  getUploadDir() {
    return this.uploadDir;
  }

  async ensureUploadDir() {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  async listImages() {
    await this.ensureUploadDir();

    const entries = await fs.readdir(this.uploadDir, { withFileTypes: true });
    const items = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .filter((entry) =>
          IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase()),
        )
        .map(async (entry) => {
          const stat = await fs.stat(join(this.uploadDir, entry.name));

          return {
            name: entry.name,
            url: `/uploads/${encodeURIComponent(entry.name)}`,
            uploadedAt: stat.mtime.toISOString(),
          };
        }),
    );

    items.sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));

    return { items };
  }

  async deleteImage(fileName: string) {
    await this.ensureUploadDir();

    const normalizedFileName = basename(fileName);

    if (
      !normalizedFileName ||
      normalizedFileName !== fileName ||
      !IMAGE_EXTENSIONS.has(extname(normalizedFileName).toLowerCase())
    ) {
      throw new BadRequestException('Invalid gallery image name.');
    }

    const targetPath = join(this.uploadDir, normalizedFileName);

    try {
      await fs.unlink(targetPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException('Gallery image not found.');
      }

      throw error;
    }

    return {
      message: 'Gallery image deleted successfully.',
      name: normalizedFileName,
    };
  }
}
