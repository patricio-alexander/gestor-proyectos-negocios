export type LoginInput = {
  username: string;
  password: string;
};

export type AuthRole = {
  id: number;
  key: string;
  name: string;
  description: string | null;
};

export type AuthUser = {
  id: string;
  username: string | null;
  email: string | null;
  display_name: string | null;
  roles: AuthRole[];
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};
