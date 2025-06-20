import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthorsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authorId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);

    // Clean up database before tests
    await prisma.book.deleteMany();
    await prisma.author.deleteMany();
  });

  afterAll(async () => {
    // Clean up database after tests
    await prisma.book.deleteMany();
    await prisma.author.deleteMany();
    await app.close();
  });

  it('POST /authors -> should create a new author', () => {
    const authorData = {
      firstName: 'George',
      lastName: 'Orwell',
      bio: 'Wrote 1984',
      birthDate: '1903-06-25',
    };
    return request(app.getHttpServer())
      .post('/authors')
      .send(authorData)
      .expect(201)
      .then((res) => {
        expect(res.body).toEqual({
          id: expect.any(String),
          ...authorData,
          birthDate: new Date(authorData.birthDate).toISOString(),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
        authorId = res.body.id;
      });
  });

  it('GET /authors/:id -> should retrieve the created author', () => {
    return request(app.getHttpServer())
      .get(`/authors/${authorId}`)
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual({
          id: authorId,
          firstName: 'George',
          lastName: 'Orwell',
          bio: 'Wrote 1984',
          birthDate: new Date('1903-06-25').toISOString(),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });
  });

  it('GET /authors/:id -> should return 404 for a non-existent author', () => {
    return request(app.getHttpServer())
        .get('/authors/non-existent-id')
        .expect(404);
  });
}); 