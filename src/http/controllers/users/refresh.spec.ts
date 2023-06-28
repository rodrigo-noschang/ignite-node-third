import { app } from '@/app';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Refresh Token Controller (e2e)', () => {
    beforeAll(async () => {
        await app.ready();
    })

    afterAll(async () => {
        await app.close();
    })


    it('should be able to refresh a token', async () => {
        await request(app.server)
            .post('/users')
            .send({
                name: 'John Doe',
                email: 'johndoe@mail.com',
                password: '123456'
            });

        const authResponse = await request(app.server)
            .post('/sessions')
            .send({
                email: 'johndoe@mail.com',
                password: '123456'
            });

        const cookie = authResponse.get('Set-Cookie');

        const refreshResponse = await request(app.server)
            .patch('/token/refresh')
            .set('Cookie', cookie)
            .send();

        expect(refreshResponse.statusCode).toEqual(200);
        expect(refreshResponse.get('Set-Cookie')).toEqual([
            expect.stringContaining('refreshToken=')
        ])
    })
})