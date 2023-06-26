import { GymsRepository } from "@/repositories/gyms-repository";
import { Gym } from "@prisma/client";

interface SearchGymsUseCaseRequest {
    search: string,
    page: number,
}

interface SearchGymsUseCaseResponse {
    gyms: Gym[],
}

export class SearchGymsUseCase {
    constructor(private gymsRepository: GymsRepository) { }

    async execute({ search, page }: SearchGymsUseCaseRequest): Promise<SearchGymsUseCaseResponse> {
        const gyms = await this.gymsRepository.searchMany(search, page);

        return { gyms };
    }
}