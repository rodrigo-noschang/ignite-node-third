import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { ValidateCheckinUseCase } from './validate-checkin';
import { InMemoryCheckInsRepository } from '@/repositories/in-memory/in-memory-check-ins-repository';

import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { LateCheckInValidationError } from './errors/late-check-in-validation-error';

let checkInsRepository: InMemoryCheckInsRepository;

let sut: ValidateCheckinUseCase;

describe('Check In Use Case', async () => {
    beforeEach(async () => {
        checkInsRepository = new InMemoryCheckInsRepository();

        sut = new ValidateCheckinUseCase(checkInsRepository);
        vi.useFakeTimers();
    })

    afterEach(() => {
        vi.useRealTimers();
    })

    it('should be able to validate checkin', async () => {
        const createdCheckIn = await checkInsRepository.create({
            user_id: 'user-01',
            gym_id: 'gym-01'
        });

        const { checkIn } = await sut.execute({
            checkInId: createdCheckIn.id
        })

        expect(checkIn.validated_at).toEqual(expect.any(Date));
        expect(checkInsRepository.items[0].validated_at).toEqual(expect.any(Date));
    })

    it('should not be able to validate nonexisting checkin', async () => {
        await expect(() => {
            return sut.execute({
                checkInId: 'non-existing-checkin'
            })
        }
        ).rejects.toBeInstanceOf(ResourceNotFoundError);
    })

    it('should not be able to validate checkin after 20 minutes past its creation', async () => {
        vi.setSystemTime(new Date(2023, 0, 1, 13, 40));

        const createdCheckIn = await checkInsRepository.create({
            user_id: 'user-01',
            gym_id: 'gym-01'
        });

        const TWENTY_ONE_MINUTES_IN_MILLISECONDS = 1000 * 60 * 21

        vi.advanceTimersByTime(TWENTY_ONE_MINUTES_IN_MILLISECONDS)

        await expect(() => {
            return sut.execute({
                checkInId: createdCheckIn.id
            })
        }).rejects.toBeInstanceOf(LateCheckInValidationError);
    })
})