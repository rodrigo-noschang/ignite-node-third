import request from 'supertest';
import { FastifyInstance } from 'fastify';

export async function createAndAuthenticateUser(app: FastifyInstance) {
    await request(app.server)
        .post('/users')
        .send({
            name: 'John Doe',
            email: 'johndoe@mail.com',
            password: '123456'
        });

    const response = await request(app.server)
        .post('/sessions')
        .send({
            email: 'johndoe@mail.com',
            password: '123456'
        });

    const { token } = response.body;

    return { token };
}