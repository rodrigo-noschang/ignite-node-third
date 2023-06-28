import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function createAndAuthenticateUser(app: FastifyInstance, isAdmin: boolean = false) {
    const user = await prisma.user.create({
        data: {
            name: 'John Doe',
            email: 'johndoe@mail.com',
            password_hash: await hash('123456', 6),
            role: isAdmin ? 'ADMIN' : 'MEMBER'
        }
    })

    const response = await request(app.server)
        .post('/sessions')
        .send({
            email: 'johndoe@mail.com',
            password: '123456'
        });

    const { token } = response.body;

    return { token };
}