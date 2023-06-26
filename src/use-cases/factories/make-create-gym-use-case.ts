import { PrismaGymsRepository } from "@/repositories/prisma/prisma-gym-repository";
import { CreateGymUseCase } from "../create-gym";

export function makeCreateGymUseCase() {
    const gymRepository = new PrismaGymsRepository();
    const useCase = new CreateGymUseCase(gymRepository);

    return useCase;
}