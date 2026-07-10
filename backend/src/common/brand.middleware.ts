import { Injectable, NestMiddleware } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class BrandMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: any, res: any, next: () => void) {
    const brand = req.session?.user?.brand || 'BIGWINGS';
    const branchCode = req.session?.user?.branchCode || null;
    const role = req.session?.user?.role || null;
    this.cls.set('brand', brand);
    this.cls.set('role', role);
    if (branchCode) {
      this.cls.set('branchCode', branchCode);
    }
    next();
  }
}
