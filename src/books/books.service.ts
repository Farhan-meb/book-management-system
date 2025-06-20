import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Book } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const { authorId, publishedDate, ...bookData } = createBookDto;

    // Check if author exists
    const author = await this.prisma.author.findUnique({
      where: { id: authorId },
    });
    if (!author) {
      throw new BadRequestException(
        `Author with ID "${authorId}" does not exist.`,
      );
    }

    try {
      return await this.prisma.book.create({
        data: {
          ...bookData,
          ...(publishedDate && { publishedDate: new Date(publishedDate) }),
          author: {
            connect: { id: authorId },
          },
        },
        include: { author: true },
      });
    } catch (error) {
      // P2002 is Prisma's code for unique constraint violation
      if (error.code === 'P2002' && error.meta?.target?.includes('isbn')) {
        throw new BadRequestException(
          `Book with ISBN "${createBookDto.isbn}" already exists.`,
        );
      }
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    authorId?: string,
  ): Promise<Book[]> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (authorId) {
      where.authorId = authorId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.book.findMany({
      skip,
      take: limit,
      where,
      include: { author: true },
    });
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!book) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
    const { authorId, publishedDate, ...bookData } = updateBookDto;

    if (authorId) {
      const author = await this.prisma.author.findUnique({
        where: { id: authorId },
      });
      if (!author) {
        throw new BadRequestException(
          `Author with ID "${authorId}" does not exist.`,
        );
      }
    }

    try {
      return await this.prisma.book.update({
        where: { id },
        data: {
          ...bookData,
          ...(publishedDate && { publishedDate: new Date(publishedDate) }),
          ...(authorId && { author: { connect: { id: authorId } } }),
        },
        include: { author: true },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Book with ID "${id}" not found`);
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('isbn')) {
        throw new BadRequestException(
          `Book with ISBN "${updateBookDto.isbn}" already exists.`,
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const book = await this.findOne(id);
    await this.prisma.book.delete({ where: { id: book.id } });
  }
}
