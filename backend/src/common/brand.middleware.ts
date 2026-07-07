import { Injectable, NestMiddleware } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class BrandMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: any, res: any, next: () => void) {
    const brand = req.session?.user?.brand || 'BIGWINGS';
    this.cls.set('brand', brand);
    next();
  }
}
