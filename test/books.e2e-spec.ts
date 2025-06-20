import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateAuthorDto } from '../src/authors/dto/create-author.dto';
import { PrismaService } from '../src/prisma/prisma.service';

describe('BooksController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.book.deleteMany();
    await prisma.author.deleteMany();
  });

  afterAll(async () => {
    await prisma.book.deleteMany();
    await prisma.author.deleteMany();
    await app.close();
  });

  it.skip('should process the full book lifecycle successfully', async () => {
    // Step 1: Create an author
    const authorData: CreateAuthorDto = {
      firstName: 'Jane',
      lastName: 'Austen',
      birthDate: '1775-12-16',
    };
    const authorRes = await request(app.getHttpServer())
      .post('/authors')
      .send(authorData)
      .expect(201);
    const authorId = authorRes.body.id;
    expect(authorId).toBeDefined();

    // Step 2: Create a book
    const bookData = {
      title: 'Pride and Prejudice',
      isbn: '978-0-14-143951-8',
      authorId: authorId,
    };
    const bookRes = await request(app.getHttpServer())
      .post('/books')
      .send(bookData)
      .expect(201);
    const bookId = bookRes.body.id;
    expect(bookId).toBeDefined();

    // Step 3: Get the created book
    const getRes = await request(app.getHttpServer())
      .get(`/books/${bookId}`)
      .expect(200);
    expect(getRes.body.id).toEqual(bookId);

    // Step 4: Update the book
    const updatedData = { genre: 'Classic Romance' };
    const updateRes = await request(app.getHttpServer())
      .patch(`/books/${bookId}`)
      .send(updatedData)
      .expect(200);
    expect(updateRes.body.genre).toEqual('Classic Romance');

    // Step 5: Delete the book
    await request(app.getHttpServer()).delete(`/books/${bookId}`).expect(204);

    // Step 6: Verify the book is deleted
    await request(app.getHttpServer()).get(`/books/${bookId}`).expect(404);
  });
});
