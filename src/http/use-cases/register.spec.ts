import { compare } from 'bcryptjs';
import { describe, it, expect } from 'vitest';

import { RegisterUseCase } from './register';
import { InMemoryUsersRepository } from '@/repositories/prisma/in-memory/in-memory-users-repository';

import { UserAlreadyExistsError } from '@/errors/user-already-exists-error';

describe('Register Use Case', () => {
    it('should be able to register', async () => {
        const inMemoryRepository = new InMemoryUsersRepository();
        const registerUseCase = new RegisterUseCase(inMemoryRepository);

        const { user } = await registerUseCase.execute({
            name: 'John Doe',
            email: 'johndoe@mail.com',
            password: '123456'
        })

        expect(user.id).toEqual(expect.any(String));
    })

    it('should hash password upon registration', async () => {
        const inMemoryRepository = new InMemoryUsersRepository()
        const registerUseCase = new RegisterUseCase(inMemoryRepository);

        const { user } = await registerUseCase.execute({
            name: 'John Doe',
            email: 'johndoe@mail.com',
            password: '123456'
        })

        const isPasswordCorrectlyHashed = await compare('123456', user.password_hash);

        expect(isPasswordCorrectlyHashed).toBe(true);
    })

    it('should not be able to register the same email twice', async () => {
        const inMemoryRepository = new InMemoryUsersRepository()
        const registerUseCase = new RegisterUseCase(inMemoryRepository);

        const email = 'johndoe@mail.com'

        await registerUseCase.execute({
            name: 'John Doe',
            email,
            password: '123456'
        })

        expect(() => {
            return registerUseCase.execute({
                name: 'John Doe',
                email,
                password: '123456'
            })
        }).rejects.toBeInstanceOf(UserAlreadyExistsError);
    })
})