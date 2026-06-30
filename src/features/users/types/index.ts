export type User = {
  id: string;
  username: string | null;
  email: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
};

export type CreateUserInput = {
  username: string;
  email?: string;
  password: string;
};

export type UpdateUserInput = {
  username?: string;
  email?: string;
  password?: string;
};
