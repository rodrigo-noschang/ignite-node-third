import { hash } from "bcryptjs";

import { UsersRepository } from "@/repositories/prisma/users-repository";

import { UserAlreadyExistsError } from "@/errors/user-already-exists-error";

interface registerUseCaseParams {
    name: string,
    email: string,
    password: string,
}

export class RegisterUseCase {
    constructor(private userRepository: UsersRepository) { }

    async execute({ name, email, password }: registerUseCaseParams) {
        const password_hash = await hash(password, 6);

        const user = await this.userRepository.findByEmail(email);

        if (!user) throw new UserAlreadyExistsError();

        await this.userRepository.create({
            name,
            email,
            password_hash
        })
    }
}