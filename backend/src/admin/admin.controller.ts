import { Controller, Get, Headers, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user?: {
    managerId: string;
    loginId: string;
    name: string;
  };
};

@Controller('admin')
export class AdminController {
  @UseGuards(JwtAuthGuard)
  @Get('ops/server-info')
  getServerInfo(
    @Req() request: AuthenticatedRequest,
    @Headers('x-debug-session-id') debugSessionId?: string,
  ) {
    return {
      podName: process.env.POD_NAME || process.env.HOSTNAME || 'local-backend',
      hostname: process.env.HOSTNAME || 'local-backend',
      nodeName: process.env.NODE_NAME || null,
      debugSessionId: debugSessionId || null,
      manager: request.user
        ? {
            managerId: request.user.managerId,
            loginId: request.user.loginId,
            name: request.user.name,
          }
        : null,
      timestamp: new Date().toISOString(),
    };
  }
}
