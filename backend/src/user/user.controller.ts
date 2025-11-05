import { Controller, Get, Post, Patch, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAll() {
    return this.userService.getAll();
  }

  @Post()
  async create(@Body() createUserDto: { username: string; password: string; role: 'SUPER_ADMIN' | 'USER' | 'ENQUIRY' }) {
    try {
      return await this.userService.create(createUserDto);
    } catch (error) {
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
}
