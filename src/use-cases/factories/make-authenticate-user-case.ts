import { AuthenticateUseCase } from "../authenticate";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";

export function makeAuthenticateUserCase() {
    const userRepository = new PrismaUsersRepository();
    const useCase = new AuthenticateUseCase(userRepository);

    return useCase;
}