import { app } from '@/app';
import exp from 'constants';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Profile Controller (e2e)', () => {
    beforeAll(async () => {
        await app.ready();
    })

    afterAll(async () => {
        await app.close();
    })


    it('should be able to get own profile', async () => {
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

        const profileResponse = await request(app.server)
            .get('/me')
            .set('Authorization', `Bearer ${token}`);

        expect(profileResponse.statusCode).toEqual(200);
        expect(profileResponse.body.user).toEqual(
            expect.objectContaining({
                email: 'johndoe@mail.com'
            })
        );
    })
})