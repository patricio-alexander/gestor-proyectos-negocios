export type RoleRecord = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  user_count?: number;
};

export type UserRecord = {
  id: string;
  username: string | null;
  email: string | null;
  display_name: string | null;
  created_at: string;
  roles: RoleRecord[];
};

export type CreateUserInput = {
  username: string;
  email?: string;
  password: string;
  display_name?: string;
  role_ids?: number[];
};

export type UpdateUserInput = {
  username?: string;
  email?: string;
  password?: string;
  display_name?: string;
  role_ids?: number[];
};

export type ProfileInput = {
  display_name?: string;
  email?: string;
  password?: string;
  current_password?: string;
};

export type CreateRoleInput = {
  key: string;
  name: string;
  description?: string;
};

export type UpdateRoleInput = Partial<CreateRoleInput>;
