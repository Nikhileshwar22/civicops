import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  scope: {
    type: string;
    zoneIds?: string[];
    circleIds?: string[];
    wardIds?: string[];
    departmentIds?: string[];
  };
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext): CurrentUserData | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;
    return data ? user?.[data] : user;
  },
);
