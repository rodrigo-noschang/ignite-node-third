import { hash } from 'bcryptjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { GetUserProfileUseCase } from './get-user-profile';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-users-repository';

let userRepository: InMemoryUsersRepository;
let sut: GetUserProfileUseCase;

describe('Get User Profile Use Case', async () => {
    beforeEach(() => {
        userRepository = new InMemoryUsersRepository();
        sut = new GetUserProfileUseCase(userRepository);
    })

    it('should be able to get user profile by id', async () => {
        const createdUser = await userRepository.create({
            name: 'John Doe',
            email: 'johndoe@mail.com',
            password_hash: await hash('123456', 6)
        })

        const { user } = await sut.execute({ userId: createdUser.id });

        expect(user.name).toBe('John Doe');
    })

    it('should not be able to get user profile with wrong id', async () => {
        expect(() => {
            return sut.execute({
                userId: 'non-existing-id'
            })
        }).rejects.toBeInstanceOf(ResourceNotFoundError);
    })
})