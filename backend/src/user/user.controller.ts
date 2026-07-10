import { Controller, Get, Post, Patch, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAll() {
    return this.userService.getAll();
  }

  @Post()
  async create(@Body() createUserDto: { username: string; password: string; role: any; brand?: string; branchId?: number; branchCode?: string }) {
    try {
      return await this.userService.create(createUserDto);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new HttpException('Username already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: { username?: string; password?: string; role?: any; brand?: string; branchId?: number; branchCode?: string }) {
    try {
      return await this.userService.update(parseInt(id), updateUserDto);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new HttpException('Username already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id/toggle-active')
  async toggleActive(@Param('id') id: string) {
    try {
      return await this.userService.toggleActive(parseInt(id));
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      return await this.userService.delete(parseInt(id));
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new HttpException('Cannot delete this user because they have associated records (payments, receipts, etc.) in the system.', HttpStatus.CONFLICT);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
