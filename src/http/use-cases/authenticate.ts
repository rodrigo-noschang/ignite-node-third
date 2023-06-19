import { User } from "@prisma/client";

import { UsersRepository } from "@/repositories/users-repository";
import { InvalidCredentialsError } from "./errors/invalid-credentials-error";
import { compare } from "bcryptjs";

interface AuthenticateUseCaseRequest {
    email: string,
    password: string
}

interface AuthenticateUseCaseReply {
    user: User
}

export class AuthenticateUseCase {
    constructor(private usersRepository: UsersRepository) { }

    async execute({ email, password }: AuthenticateUseCaseRequest): Promise<AuthenticateUseCaseReply> {
        const user = await this.usersRepository.findByEmail(email);

        if (!user) {
            throw new InvalidCredentialsError();
        }

        const doPasswordsMatch = await compare(password, user.password_hash);

        if (!doPasswordsMatch) {
            throw new InvalidCredentialsError();
        }

        return {
            user
        }
    }
}