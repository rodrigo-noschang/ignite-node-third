import { describe, it, expect, beforeEach } from 'vitest';

import { InMemoryCheckInsRepository } from '@/repositories/in-memory/in-memory-check-ins-repository';
import { FetchUserCheckInsHistoryUseCase } from './fetch-user-check-ins-history';

let checkInsRepository: InMemoryCheckInsRepository;

let sut: FetchUserCheckInsHistoryUseCase;

describe('Fetch User Check Ins History Use Case', async () => {
    beforeEach(async () => {
        checkInsRepository = new InMemoryCheckInsRepository();

        sut = new FetchUserCheckInsHistoryUseCase(checkInsRepository);
    })

    it('should be able to get check-ins history ', async () => {
        await checkInsRepository.create({
            gym_id: 'gym-01',
            user_id: 'user-01'
        })

        await checkInsRepository.create({
            gym_id: 'gym-02',
            user_id: 'user-01'
        })

        const { checkIns } = await sut.execute({
            userId: 'user-01',
            page: 1
        })

        expect(checkIns).toHaveLength(2);
        expect(checkIns).toEqual([
            expect.objectContaining({ gym_id: 'gym-01' }),
            expect.objectContaining({ gym_id: 'gym-02' }),
        ])
    })

    it('should limit 20 check-ins per page', async () => {
        for (let i = 1; i <= 22; i++) {
            await checkInsRepository.create({
                gym_id: `gym-${i}`,
                user_id: 'user-01'
            })
        }

        const { checkIns } = await sut.execute({
            userId: 'user-01',
            page: 1
        });

        expect(checkIns).toHaveLength(20);
    })

    it('should should be able to paginate between check ins', async () => {
        for (let i = 1; i <= 22; i++) {
            await checkInsRepository.create({
                gym_id: `gym-${i}`,
                user_id: 'user-01'
            })
        }

        const { checkIns } = await sut.execute({
            userId: 'user-01',
            page: 2
        });

        expect(checkIns).toHaveLength(2);
        expect(checkIns).toEqual([
            expect.objectContaining({ gym_id: 'gym-21' }),
            expect.objectContaining({ gym_id: 'gym-22' })
        ])
    })
})