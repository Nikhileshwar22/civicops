import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CurrentUserData } from '../decorators/current-user.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: CurrentUserData = request.user;

    if (!user || !user.tenantId) {
      throw new ForbiddenException('Tenant context not established');
    }

    // Attach tenant context to request for downstream use
    request.tenantId = user.tenantId;
    return true;
  }
}
