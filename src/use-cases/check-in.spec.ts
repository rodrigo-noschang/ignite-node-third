import { Decimal } from '@prisma/client/runtime/library';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { CheckInUseCase } from './check-in';
import { InMemoryGymsRepository } from '@/repositories/in-memory/in-memory-gyms-repository';
import { InMemoryCheckInsRepository } from '@/repositories/in-memory/in-memory-check-ins-repository';

let checkInsRepository: InMemoryCheckInsRepository;
let gymsRepository: InMemoryGymsRepository;

let sut: CheckInUseCase;

describe('Check In Use Case', async () => {
    beforeEach(async () => {
        checkInsRepository = new InMemoryCheckInsRepository();
        gymsRepository = new InMemoryGymsRepository();

        sut = new CheckInUseCase(checkInsRepository, gymsRepository);

        await gymsRepository.create({
            id: 'gym-01',
            title: 'New Gym',
            latitude: 0,
            longitude: 0,
            phone: null,
            description: null,
        })

        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should be able to checkin in', async () => {
        const { checkIn } = await sut.execute({
            userId: 'user-01',
            gymId: 'gym-01'
        })

        expect(checkIn.id).toEqual(expect.any(String));
    })

    it('should not be able to check in twice in the same day', async () => {
        vi.setSystemTime(new Date(2022, 0, 12, 8, 0, 0));

        await sut.execute({
            userId: 'user-01',
            gymId: 'gym-01'
        })

        await expect(() => {
            return sut.execute({
                userId: 'user-01',
                gymId: 'gym-01'
            })
        }).rejects.toBeInstanceOf(Error)
    })

    it('should be able to check in twice in different days', async () => {
        vi.setSystemTime(new Date(2022, 0, 12, 8, 0, 0));

        await sut.execute({
            userId: 'user-01',
            gymId: 'gym-01'
        })

        vi.setSystemTime(new Date(2022, 0, 13, 8, 0, 0));

        const { checkIn } = await sut.execute({
            userId: 'user-01',
            gymId: 'gym-01'
        });

        expect(checkIn.id).toEqual(expect.any(String));
    })
})