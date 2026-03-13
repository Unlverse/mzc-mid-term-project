import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const manager = await this.prismaService.managerAccount.findUnique({
      where: { loginId: dto.loginId },
    });

    if (!manager) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await compare(dto.password, manager.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: manager.id.toString(),
      loginId: manager.loginId,
      name: manager.name,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      manager: {
        id: Number(manager.id),
        loginId: manager.loginId,
        name: manager.name,
      },
    };
  }
}
