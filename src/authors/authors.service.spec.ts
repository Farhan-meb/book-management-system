import { Test, TestingModule } from '@nestjs/testing';
import { AuthorsService } from './authors.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Author } from '@prisma/client';

const mockPrismaService = {
  author: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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

describe('AuthorsService', () => {
  let service: AuthorsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new author', async () => {
      const createDto = { firstName: 'John', lastName: 'Doe' };
      prisma.author.create.mockResolvedValue(testAuthor);

      const result = await service.create(createDto);
      expect(result).toEqual(testAuthor);
      expect(prisma.author.create).toHaveBeenCalledWith({
        data: { ...createDto, birthDate: undefined },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of authors', async () => {
      prisma.author.findMany.mockResolvedValue([testAuthor]);
      const result = await service.findAll();
      expect(result).toEqual([testAuthor]);
      expect(prisma.author.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single author', async () => {
      prisma.author.findUnique.mockResolvedValue(testAuthor);
      const result = await service.findOne(testAuthor.id);
      expect(result).toEqual(testAuthor);
      expect(prisma.author.findUnique).toHaveBeenCalledWith({
        where: { id: testAuthor.id },
      });
    });

    it('should throw a NotFoundException if author is not found', async () => {
      prisma.author.findUnique.mockResolvedValue(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an author', async () => {
      const updateDto = { bio: 'An updated bio' };
      const updatedAuthor = { ...testAuthor, ...updateDto };
      prisma.author.update.mockResolvedValue(updatedAuthor);

      const result = await service.update(testAuthor.id, updateDto);
      expect(result).toEqual(updatedAuthor);
      expect(prisma.author.update).toHaveBeenCalledWith({
        where: { id: testAuthor.id },
        data: { ...updateDto, birthDate: undefined },
      });
    });

    it('should throw a NotFoundException if author to update is not found', async () => {
      prisma.author.update.mockRejectedValue({ code: 'P2025' });
      await expect(service.update('non-existent-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an author', async () => {
      prisma.author.findUnique.mockResolvedValue(testAuthor); // findOne needs to succeed
      prisma.author.delete.mockResolvedValue(testAuthor);
      
      await service.remove(testAuthor.id);
      expect(prisma.author.delete).toHaveBeenCalledWith({
        where: { id: testAuthor.id },
      });
    });

    it('should throw a NotFoundException if author to delete is not found', async () => {
      prisma.author.findUnique.mockResolvedValue(null);
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
