import { INestApplication } from '@nestjs/common';
import * as compression from 'compression';
import helmet from 'helmet';
import * as morgan from 'morgan';

export function configureMiddleware(app: INestApplication): void {
  app.enableCors({ origin: true, credentials: true });
  app.use(helmet());
  app.use(compression());
  app.use(morgan('dev'));
}
