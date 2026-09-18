import type { Role } from "@/generated/prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
      departmentId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    role: Role;
    departmentId: string | null;
  }
}
