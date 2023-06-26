import { ValidateCheckinUseCase } from "../validate-checkin";
import { PrismaCheckInsRepository } from "@/repositories/prisma/prisma-check-ins-repository";

export function makeValidateCheckInsUseCase() {
    const checkInsRepository = new PrismaCheckInsRepository();
    const useCase = new ValidateCheckinUseCase(checkInsRepository);

    return useCase;
}