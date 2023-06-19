import { hash } from "bcryptjs";
import { describe, it, expect, beforeEach } from "vitest";

import { AuthenticateUseCase } from "./authenticate";
import { InvalidCredentialsError } from "./errors/invalid-credentials-error";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";

let inMemoryRepository: InMemoryUsersRepository;
let sut: AuthenticateUseCase;

describe('Authenticate Use Case', () => {
    beforeEach(() => {
        inMemoryRepository = new InMemoryUsersRepository();
        sut = new AuthenticateUseCase(inMemoryRepository);
    })

    it('should be able to authenticate', async () => {
        inMemoryRepository.create({
            name: 'John Doe',
            email: 'johndoe@mail.com',
            password_hash: await hash('123456', 6)
        })

        const { user } = await sut.execute({
            email: 'johndoe@mail.com',
            password: '123456'
        })

        expect(user.id).toEqual(expect.any(String));
    })

    it('should not be able to authenticate with wrong email', async () => {
        expect(() => {
            return sut.execute({
                email: 'johndoe@mail.com',
                password: '123456'
            })
        }).rejects.toBeInstanceOf(InvalidCredentialsError)
    })

    it('should not be able to authenticate with wrong password', async () => {
        await inMemoryRepository.create({
            name: 'John Doe',
            email: 'johndoe@mail.com',
            password_hash: await hash('123456', 6)
        })

        expect(() => {
            return sut.execute({
                email: 'johndoe@mail.com',
                password: '123123'
            })
        }).rejects.toBeInstanceOf(InvalidCredentialsError)
    })
})