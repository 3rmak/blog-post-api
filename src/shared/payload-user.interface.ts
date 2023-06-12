import { RolesEnum } from '../modules/role/entity/roles.enum';

export interface PayloadUser {
  id: string;
  email: string;
  role: RolesEnum;
}
