import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'user';
      accessibleProjects: string[];
    } & DefaultSession["user"]
  }

  interface User {
      id: string;
      role: 'admin' | 'user';
      accessibleProjects: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: 'admin' | 'user';
    accessibleProjects: string[];
  }
}
