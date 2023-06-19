import { compare } from 'bcryptjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { RegisterUseCase } from './register';
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-users-repository';

import { UserAlreadyExistsError } from './errors/user-already-exists-error';

let inMemoryRepository: InMemoryUsersRepository;
let sut: RegisterUseCase;

describe('Register Use Case', () => {
    beforeEach(() => {
        inMemoryRepository = new InMemoryUsersRepository();
        sut = new RegisterUseCase(inMemoryRepository);
    })

    it('should be able to register', async () => {
        const { user } = await sut.execute({
            name: 'John Doe',
            email: 'johndoe@mail.com',
            password: '123456'
        })

        expect(user.id).toEqual(expect.any(String));
    })

    it('should hash password upon registration', async () => {
        const { user } = await sut.execute({
            name: 'John Doe',
            email: 'johndoe@mail.com',
            password: '123456'
        })

        const isPasswordCorrectlyHashed = await compare('123456', user.password_hash);

        expect(isPasswordCorrectlyHashed).toBe(true);
    })

    it('should not be able to register the same email twice', async () => {
        const email = 'johndoe@mail.com'

        await sut.execute({
            name: 'John Doe',
            email,
            password: '123456'
        })

        await expect(() => {
            return sut.execute({
                name: 'John Doe',
                email,
                password: '123456'
            })
        }).rejects.toBeInstanceOf(UserAlreadyExistsError);
    })
})