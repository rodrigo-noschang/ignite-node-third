import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/test/create-and-authenticate-user';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Create Gym Controller (e2e)', () => {
    beforeAll(async () => {
        await app.ready();
    })

    afterAll(async () => {
        await app.close();
    })


    it('should be able to create a gym', async () => {
        const { token } = await createAndAuthenticateUser(app, true);

        const response = await request(app.server)
            .post('/gyms')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Javascript Gym',
                description: 'Some gym',
                phone: '9999999999',
                latitude: -23.9118092,
                longitude: -52.3413882,
            });

        expect(response.statusCode).toEqual(201);
    })
})