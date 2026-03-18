import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly metricsService: MetricsService,
  ) {}

  async login(dto: LoginDto) {
    const manager = await this.prismaService.managerAccount.findUnique({
      where: { loginId: dto.loginId },
    });

    if (!manager) {
      this.metricsService.recordBusinessEvent('admin_login', 'failure');
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await compare(dto.password, manager.passwordHash);

    if (!isPasswordValid) {
      this.metricsService.recordBusinessEvent('admin_login', 'failure');
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: manager.id.toString(),
      loginId: manager.loginId,
      name: manager.name,
    });

    this.metricsService.recordBusinessEvent('admin_login', 'success');

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
