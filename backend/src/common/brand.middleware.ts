import { Injectable, NestMiddleware } from '@nestjs/common';
import { brandContext } from './brand.context';

@Injectable()
export class BrandMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const brand = req.session?.user?.brand || 'BIGWINGS';
    brandContext.run(brand, () => {
      next();
    });
  }
}
