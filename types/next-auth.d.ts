import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    user: DefaultSession["user"] & {
      id?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  }
}
