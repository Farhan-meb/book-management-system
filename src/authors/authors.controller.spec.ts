import { Test, TestingModule } from '@nestjs/testing';
import { Author } from '@prisma/client';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';

const mockAuthorsService = {
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

describe('AuthorsController', () => {
  let controller: AuthorsController;
  let service: typeof mockAuthorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorsController],
      providers: [{ provide: AuthorsService, useValue: mockAuthorsService }],
    }).compile();

    controller = module.get<AuthorsController>(AuthorsController);
    service = module.get(AuthorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new author', async () => {
      const createDto = { firstName: 'John', lastName: 'Doe' };
      service.create.mockResolvedValue(testAuthor);

      const result = await controller.create(createDto);
      expect(result).toEqual(testAuthor);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of authors with default pagination', async () => {
      service.findAll.mockResolvedValue([testAuthor]);
      const result = await controller.findAll(1, 10, undefined);
      expect(result).toEqual([testAuthor]);
      expect(service.findAll).toHaveBeenCalledWith(1, 10, undefined);
    });

    it('should return authors with custom pagination and search', async () => {
      service.findAll.mockResolvedValue([testAuthor]);
      const result = await controller.findAll(2, 5, 'John');
      expect(result).toEqual([testAuthor]);
      expect(service.findAll).toHaveBeenCalledWith(2, 5, 'John');
    });
  });

  describe('findOne', () => {
    it('should return a single author', async () => {
      service.findOne.mockResolvedValue(testAuthor);
      const result = await controller.findOne(testAuthor.id);
      expect(result).toEqual(testAuthor);
      expect(service.findOne).toHaveBeenCalledWith(testAuthor.id);
    });
  });

  describe('update', () => {
    it('should update an author', async () => {
      const updateDto = { bio: 'Updated bio' };
      const updatedAuthor = { ...testAuthor, ...updateDto };
      service.update.mockResolvedValue(updatedAuthor);

      const result = await controller.update(testAuthor.id, updateDto);
      expect(result).toEqual(updatedAuthor);
      expect(service.update).toHaveBeenCalledWith(testAuthor.id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete an author', async () => {
      service.remove.mockResolvedValue(undefined);
      const result = await controller.remove(testAuthor.id);
      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(testAuthor.id);
    });
  });
});
