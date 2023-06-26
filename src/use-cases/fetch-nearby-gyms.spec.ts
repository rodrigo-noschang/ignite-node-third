import { describe, it, expect, beforeEach } from 'vitest';

import { InMemoryGymsRepository } from '@/repositories/in-memory/in-memory-gyms-repository';
import { FetchNearbyGymsUseCase } from './fetch-nearby-gyms';

let gymsRepository: InMemoryGymsRepository;

let sut: FetchNearbyGymsUseCase;

describe('Fetch Near By Gyms Use Case', async () => {
    beforeEach(async () => {
        gymsRepository = new InMemoryGymsRepository();

        sut = new FetchNearbyGymsUseCase(gymsRepository);
    })

    it('should be able to search for gyms', async () => {
        await gymsRepository.create({
            title: 'Nearby Gym',
            latitude: -24.0427884,
            longitude: -52.3911727,
            phone: null,
            description: null,
        })

        await gymsRepository.create({
            title: 'Far Away Gym',
            latitude: -23.9118092,
            longitude: -52.3413882,
            phone: null,
            description: null,
        })

        const { gyms } = await sut.execute({
            userLatitude: -24.0427884,
            userLongitude: -52.3911727
        })

        expect(gyms).toHaveLength(1);
        expect(gyms).toEqual([
            expect.objectContaining({
                title: 'Nearby Gym'
            })
        ]);
    })
})