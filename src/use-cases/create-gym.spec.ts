import { describe, it, expect, beforeEach } from "vitest";

import { CreateGymUseCase } from "./create-gym";
import { InMemoryGymsRepository } from "@/repositories/in-memory/in-memory-gyms-repository";

let gymRepository: InMemoryGymsRepository;
let sut: CreateGymUseCase;

describe('Gym Use Cases', async () => {
    beforeEach(() => {
        gymRepository = new InMemoryGymsRepository();
        sut = new CreateGymUseCase(gymRepository);
    })

    it('should be able to create new gym', async () => {
        const { gym } = await sut.execute({
            title: 'New Gym',
            latitude: 0,
            longitude: 0,
            phone: null,
            description: null,
        })

        expect(gym.id).toEqual(expect.any(String))
    })
})