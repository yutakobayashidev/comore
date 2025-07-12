export interface User {
  id: number;
  email: string;
  githubId: number;
  handle: string;
}

export interface CreateUserParams {
  githubId: number;
  email: string;
  handle: string;
}
