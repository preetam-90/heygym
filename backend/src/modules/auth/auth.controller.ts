import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { RegisterInput, LoginInput, RefreshInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) {
    try {
      const user = await this.authService.register(request.body);
      const tokens = this.authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      this.authService.setTokenCookies(reply, tokens.accessToken, tokens.refreshToken);

      return reply.status(201).send({
        success: true,
        data: { user, ...tokens },
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message: error instanceof Error ? error.message : 'Registration failed',
        },
      });
    }
  }

  async login(request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
    try {
      const user = await this.authService.login(request.body, { ip: request.ip });
      const tokens = this.authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      this.authService.setTokenCookies(reply, tokens.accessToken, tokens.refreshToken);

      return reply.send({
        success: true,
        data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, ...tokens },
      });
    } catch (error) {
      const code = (error as any)?.code;
      const statusCode = (error as any)?.statusCode;
      if (code === 'RATE_LIMITED') {
        return reply.status(429).send({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: error instanceof Error ? error.message : 'Too many login attempts',
          },
        });
      }
      if (statusCode === 403 && (code === 'ACCOUNT_SUSPENDED' || code === 'ACCOUNT_BANNED')) {
        return reply.status(403).send({
          success: false,
          error: {
            code,
            message: error instanceof Error ? error.message : 'Account is not active',
          },
        });
      }
      return reply.status(401).send({
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: error instanceof Error ? error.message : 'Login failed',
        },
      });
    }
  }

  async logout(_request: FastifyRequest, reply: FastifyReply) {
    this.authService.clearTokenCookies(reply);
    return reply.send({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = await this.authService.getMe((request.user as any).id);
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
      }
      return reply.send({
        success: true,
        data: { user },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to get user',
        },
      });
    }
  }

  async refresh(request: FastifyRequest<{ Body: RefreshInput }>, reply: FastifyReply) {
    const refreshToken = request.body?.refreshToken ?? request.cookies?.refreshToken;
    if (!refreshToken) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token required',
        },
      });
    }

    try {
      const tokens = await this.authService.refreshTokens(refreshToken);
      this.authService.setTokenCookies(reply, tokens.accessToken, tokens.refreshToken);
      return reply.send({
        success: true,
        data: tokens,
      });
    } catch (error) {
      const code = (error as any)?.code;
      if (code === 'ACCOUNT_SUSPENDED' || code === 'ACCOUNT_BANNED') {
        return reply.status(403).send({
          success: false,
          error: {
            code,
            message: error instanceof Error ? error.message : 'Account is not active',
          },
        });
      }
      return reply.status(401).send({
        success: false,
        error: {
          code: 'TOKEN_ERROR',
          message: error instanceof Error ? error.message : 'Token refresh failed',
        },
      });
    }
  }

  async forgotPassword(request: FastifyRequest<{ Body: ForgotPasswordInput }>, reply: FastifyReply) {
    try {
      const result = await this.authService.forgotPassword(request.body);
      return reply.send({
        success: result.success,
        message: result.message,
        ...(result.resetToken && { resetToken: result.resetToken }),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process password reset request',
        },
      });
    }
  }

  async resetPassword(request: FastifyRequest<{ Body: ResetPasswordInput }>, reply: FastifyReply) {
    try {
      const result = await this.authService.resetPassword(request.body);
      return reply.send({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'RESET_ERROR',
          message: error instanceof Error ? error.message : 'Password reset failed',
        },
      });
    }
  }
}