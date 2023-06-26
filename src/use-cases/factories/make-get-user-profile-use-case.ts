import { GetUserProfileUseCase } from "../get-user-profile";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";

export function makeGetUserProfileUseCase() {
    const userRepository = new PrismaUsersRepository();
    const useCase = new GetUserProfileUseCase(userRepository);

    return useCase;
}