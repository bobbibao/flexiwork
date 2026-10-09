import { CanActivate, ExecutionContext, Injectable, mixin, UnauthorizedException } from '@nestjs/common';
import { RoleEnum } from '../enums';

export const AllowedRoleGuard = (allowedRole: RoleEnum | RoleEnum[]) => {
  @Injectable()
  class AllowedRoleMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const currentUser = request.user;
      const allowedRoles: RoleEnum[] = [];

      // Get allowed roles
      if (!Array.isArray(allowedRole)) {
        allowedRoles.push(allowedRole);
      } else {
        allowedRoles.push(...allowedRole);
      }

      // Validate role permission
      if (!currentUser.role) {
        throw new UnauthorizedException('Invalid role!');
      }
      if (!allowedRoles.includes(currentUser.role)) {
        throw new UnauthorizedException('You are not allowed to do this!');
      }
      return true;
    }
  }

  const guard = mixin(AllowedRoleMixin);
  return guard;
};
