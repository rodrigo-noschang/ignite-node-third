import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

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

    await prisma.user.create({
        data: {
            name,
            email,
            password_hash
        }
    });
}