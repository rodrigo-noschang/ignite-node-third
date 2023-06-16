import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

import { PrismaUsersRepository } from "@/repositories/prisma-users-repository";

interface registerUseCaseParams {
    name: string,
    email: string,
    password: string,
}

export async function registerUseCase({ name, email, password }: registerUseCaseParams) {
    const password_hash = await hash(password, 6);

    const emailAlreadyExists = await prisma.user.findUnique({
        where: { email }
    })

    if (emailAlreadyExists) {
        throw new Error('email already exists');
    }

    const prismaUsersRepository = new PrismaUsersRepository();

    await prismaUsersRepository.create({
        name,
        email,
        password_hash
    })
}