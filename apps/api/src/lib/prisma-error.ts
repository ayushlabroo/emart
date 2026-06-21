import { Prisma } from "@emart/database";

export function isPrismaKnownError(
  err: unknown,
): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError;
}
