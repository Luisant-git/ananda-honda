import { Controller, Get, Post, Body, Session, HttpException, HttpStatus } from '@nestjs/common';
import { MenuPermissionService } from './menu-permission.service';
import { Role } from '@prisma/client';

@Controller('menu-permission')
export class MenuPermissionController {
  constructor(private readonly menuPermissionService: MenuPermissionService) {}

  @Get()
  async getByRole(@Session() session: Record<string, any>) {
    if (!session.user) {
      throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return this.menuPermissionService.getByRole(session.user.role);
  }

  @Get('all')
  async getAll(@Session() session: Record<string, any>) {
    if (!session.user || session.user.role !== 'DEVELOPER') {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }
    return this.menuPermissionService.getAll();
  }

  @Post()
  async upsert(@Body() body: { role: Role; permissions: any }, @Session() session: Record<string, any>) {
    if (!session.user || session.user.role !== 'DEVELOPER') {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }
    return this.menuPermissionService.upsert(body.role, body.permissions);
  }
}
