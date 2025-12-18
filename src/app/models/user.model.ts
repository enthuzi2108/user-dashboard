export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

export type UserRole = 'Admin' | 'Editor' | 'Viewer';

