import { describe, it, expect, beforeEach } from 'vitest';

import { InMemoryGymsRepository } from '@/repositories/in-memory/in-memory-gyms-repository';
import { SearchGymsUseCase } from './search-gyms';

let gymsRepository: InMemoryGymsRepository;

let sut: SearchGymsUseCase;

describe('Fetch User Check Ins History Use Case', async () => {
    beforeEach(async () => {
        gymsRepository = new InMemoryGymsRepository();

        sut = new SearchGymsUseCase(gymsRepository);
    })

    it('should be able to search for gyms', async () => {
        await gymsRepository.create({
            title: 'Javascript Gym',
            latitude: 0,
            longitude: 0,
            phone: null,
            description: null,
        })

        await gymsRepository.create({
            title: 'Typescript Gym',
            latitude: 0,
            longitude: 0,
            phone: null,
            description: null,
        })

        const { gyms } = await sut.execute({
            search: 'Javascript',
            page: 1
        })

        expect(gyms).toHaveLength(1);
        expect(gyms).toEqual([
            expect.objectContaining({ title: 'Javascript Gym' }),
        ])
    })

    it('should limit 20 check-ins per page', async () => {
        for (let i = 1; i <= 22; i++) {
            await gymsRepository.create({
                title: `Javascript Gym ${i}`,
                latitude: 0,
                longitude: 0,
                phone: null,
                description: null,
            })
        }

        const { gyms } = await sut.execute({
            search: 'Javascript',
            page: 1
        });

        expect(gyms).toHaveLength(20);
    })

    it('should should be able to paginate between check ins', async () => {
        for (let i = 1; i <= 22; i++) {
            await gymsRepository.create({
                title: `Javascript Gym ${i}`,
                latitude: 0,
                longitude: 0,
                phone: null,
                description: null,
            })
        }

        const { gyms } = await sut.execute({
            search: 'Javascript',
            page: 2
        });

        expect(gyms).toHaveLength(2);
        expect(gyms).toEqual([
            expect.objectContaining({ title: 'Javascript Gym 21' }),
            expect.objectContaining({ title: 'Javascript Gym 22' })
        ])
    })
})