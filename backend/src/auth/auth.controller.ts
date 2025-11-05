import { Controller, Post, Body, HttpException, HttpStatus, Session, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: { username: string; password: string; role: 'SUPER_ADMIN' | 'USER' | 'ENQUIRY' | 'ACCOUNT' }, @Session() session: Record<string, any>) {
    try {
      const user = await this.authService.register(registerDto);
      session.user = user;
      return user;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }, @Session() session: Record<string, any>) {
    try {
      const user = await this.authService.login(loginDto);
      session.user = user;
      console.log('User logged in:', user);
      return user;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('logout')
  async logout(@Session() session: Record<string, any>) {
    session.destroy();
    return { message: 'Logged out successfully' };
  }

  @Get('validate')
  async validate(@Session() session: Record<string, any>) {
    if (!session.user) {
      throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
    }
    const user = await this.authService.validateUser(session.user.id);
    if (!user || !user.isActive) {
      session.destroy();
      throw new HttpException('Your account has been deactivated. Please contact super admin', HttpStatus.UNAUTHORIZED);
    }
    return session.user;
  }

  @Post('change-password')
  async changePassword(@Body() changePasswordDto: { newPassword: string }, @Session() session: Record<string, any>) {
    if (!session.user) {
      throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
    }
    try {
      await this.authService.changePassword(session.user.id, changePasswordDto.newPassword);
      return { message: 'Password changed successfully' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}