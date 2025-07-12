export interface User {
  id: number;
  email: string;
  githubId: number;
  username: string;
}

export interface CreateUserParams {
  githubId: number;
  email: string;
  username: string;
}
