import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Author, Book } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BooksService } from './books.service';

const mockPrismaService = {
  book: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  author: {
    findUnique: jest.fn(),
  },
};

const testAuthor: Author = {
  id: 'test-author-id',
  firstName: 'John',
  lastName: 'Doe',
  bio: 'A great author',
  birthDate: new Date('1980-01-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const testBook: Book & { author: Author } = {
  id: 'test-book-id',
  title: 'Test Book',
  isbn: '978-3-16-148410-0',
  publishedDate: new Date('2023-01-01'),
  genre: 'Fiction',
  createdAt: new Date(),
  updatedAt: new Date(),
  authorId: testAuthor.id,
  author: testAuthor,
};

describe('BooksService', () => {
  let service: BooksService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new book', async () => {
      const createDto = {
        title: 'Test Book',
        isbn: '978-3-16-148410-0',
        authorId: testAuthor.id,
      };

      prisma.author.findUnique.mockResolvedValue(testAuthor);
      prisma.book.create.mockResolvedValue(testBook);

      const result = await service.create(createDto);
      expect(result).toEqual(testBook);
      expect(prisma.author.findUnique).toHaveBeenCalledWith({
        where: { id: testAuthor.id },
      });
      expect(prisma.book.create).toHaveBeenCalledWith({
        data: {
          title: createDto.title,
          isbn: createDto.isbn,
          publishedDate: undefined,
          author: { connect: { id: testAuthor.id } },
        },
        include: { author: true },
      });
    });

    it('should throw BadRequestException if author does not exist', async () => {
      const createDto = {
        title: 'Test Book',
        isbn: '978-3-16-148410-0',
        authorId: 'non-existent-author',
      };

      prisma.author.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if ISBN already exists', async () => {
      const createDto = {
        title: 'Test Book',
        isbn: '978-3-16-148410-0',
        authorId: testAuthor.id,
      };

      prisma.author.findUnique.mockResolvedValue(testAuthor);
      prisma.book.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['isbn'] },
      });

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of books', async () => {
      prisma.book.findMany.mockResolvedValue([testBook]);
      const result = await service.findAll();
      expect(result).toEqual([testBook]);
      expect(prisma.book.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        include: { author: true },
      });
    });

    it('should apply pagination and search filters', async () => {
      prisma.book.findMany.mockResolvedValue([testBook]);
      const result = await service.findAll(2, 5, 'test', testAuthor.id);
      expect(result).toEqual([testBook]);
      expect(prisma.book.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        where: {
          authorId: testAuthor.id,
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { isbn: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        include: { author: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single book', async () => {
      prisma.book.findUnique.mockResolvedValue(testBook);
      const result = await service.findOne(testBook.id);
      expect(result).toEqual(testBook);
      expect(prisma.book.findUnique).toHaveBeenCalledWith({
        where: { id: testBook.id },
        include: { author: true },
      });
    });

    it('should throw a NotFoundException if book is not found', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a book', async () => {
      const updateDto = { genre: 'Sci-Fi' };
      const updatedBook = { ...testBook, ...updateDto };
      prisma.book.update.mockResolvedValue(updatedBook);

      const result = await service.update(testBook.id, updateDto);
      expect(result).toEqual(updatedBook);
      expect(prisma.book.update).toHaveBeenCalledWith({
        where: { id: testBook.id },
        data: { ...updateDto, publishedDate: undefined },
        include: { author: true },
      });
    });

    it('should throw a NotFoundException if book to update is not found', async () => {
      prisma.book.update.mockRejectedValue({ code: 'P2025' });
      await expect(service.update('non-existent-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate authorId if provided', async () => {
      const updateDto = { authorId: 'new-author-id' };
      prisma.author.findUnique.mockResolvedValue(null);

      await expect(service.update(testBook.id, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a book', async () => {
      prisma.book.findUnique.mockResolvedValue(testBook);
      prisma.book.delete.mockResolvedValue(testBook);

      await service.remove(testBook.id);
      expect(prisma.book.delete).toHaveBeenCalledWith({
        where: { id: testBook.id },
      });
    });

    it('should throw a NotFoundException if book to delete is not found', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
