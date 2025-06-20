import { Test, TestingModule } from '@nestjs/testing';
import { Author, Book } from '@prisma/client';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

const mockBooksService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
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

describe('BooksController', () => {
  let controller: BooksController;
  let service: typeof mockBooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [{ provide: BooksService, useValue: mockBooksService }],
    }).compile();

    controller = module.get<BooksController>(BooksController);
    service = module.get(BooksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new book', async () => {
      const createDto = {
        title: 'Test Book',
        isbn: '978-3-16-148410-0',
        authorId: testAuthor.id,
      };
      service.create.mockResolvedValue(testBook);

      const result = await controller.create(createDto);
      expect(result).toEqual(testBook);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of books with default pagination', async () => {
      service.findAll.mockResolvedValue([testBook]);
      const result = await controller.findAll(1, 10, undefined, undefined);
      expect(result).toEqual([testBook]);
      expect(service.findAll).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('should return books with custom pagination, search, and author filter', async () => {
      service.findAll.mockResolvedValue([testBook]);
      const result = await controller.findAll(2, 5, 'test', testAuthor.id);
      expect(result).toEqual([testBook]);
      expect(service.findAll).toHaveBeenCalledWith(2, 5, 'test', testAuthor.id);
    });
  });

  describe('findOne', () => {
    it('should return a single book', async () => {
      service.findOne.mockResolvedValue(testBook);
      const result = await controller.findOne(testBook.id);
      expect(result).toEqual(testBook);
      expect(service.findOne).toHaveBeenCalledWith(testBook.id);
    });
  });

  describe('update', () => {
    it('should update a book', async () => {
      const updateDto = { genre: 'Sci-Fi' };
      const updatedBook = { ...testBook, ...updateDto };
      service.update.mockResolvedValue(updatedBook);

      const result = await controller.update(testBook.id, updateDto);
      expect(result).toEqual(updatedBook);
      expect(service.update).toHaveBeenCalledWith(testBook.id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a book', async () => {
      service.remove.mockResolvedValue(undefined);
      const result = await controller.remove(testBook.id);
      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(testBook.id);
    });
  });
});
