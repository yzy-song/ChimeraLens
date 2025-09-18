import { SetMetadata } from '@nestjs/common';
import { Role } from '@chimeralens/db';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
