import { Injectable, NotFoundException } from '@nestjs/common';
import { Author } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Injectable()
export class AuthorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAuthorDto: CreateAuthorDto): Promise<Author> {
    const { birthDate, ...authorData } = createAuthorDto;
    return this.prisma.author.create({
      data: {
        ...authorData,
        ...(birthDate && { birthDate: new Date(birthDate) }),
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<Author[]> {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return this.prisma.author.findMany({
      skip,
      take: limit,
      where,
    });
  }

  async findOne(id: string): Promise<Author> {
    const author = await this.prisma.author.findUnique({ where: { id } });
    if (!author) {
      throw new NotFoundException(`Author with ID "${id}" not found`);
    }
    return author;
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<Author> {
    try {
      const { birthDate, ...authorData } = updateAuthorDto;
      return await this.prisma.author.update({
        where: { id },
        data: {
          ...authorData,
          ...(birthDate && { birthDate: new Date(birthDate) }),
        },
      });
    } catch (error) {
      // P2025 is Prisma's code for record not found on update
      if (error.code === 'P2025') {
        throw new NotFoundException(`Author with ID "${id}" not found`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const author = await this.findOne(id);
    // Note: This will fail if the author has books, due to the database constraint.
    // A more robust implementation would handle this, e.g., by deleting books first or preventing deletion.
    await this.prisma.author.delete({ where: { id: author.id } });
  }
}
