export type LoginInput = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    username: string;
    email: string | null;
  };
};

export type AuthUser = {
  id: string;
  username: string;
  email: string | null;
};
