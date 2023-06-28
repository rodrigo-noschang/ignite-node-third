import { app } from '@/app';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createAndAuthenticateUser } from '@/utils/test/create-and-authenticate-user';

describe('Nearby Controller (e2e)', () => {
    beforeAll(async () => {
        await app.ready();
    })

    afterAll(async () => {
        await app.close();
    })

    it('should be able to search for nearby gyms', async () => {
        const { token } = await createAndAuthenticateUser(app);

        await request(app.server)
            .post('/gyms')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Nearby Gym',
                latitude: -24.0427884,
                longitude: -52.3911727,
                phone: null,
                description: 'null',
            })

        await request(app.server)
            .post('/gyms')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Far Away Gym',
                latitude: -34.0427884,
                longitude: -97.3911727,
                phone: null,
                description: 'null',
            })

        const response = await request(app.server)
            .get('/gyms/nearby')
            .query({
                latitude: -24.0427884,
                longitude: -52.3911727
            })
            .set('Authorization', `Bearer ${token}`)
            .send();

        expect(response.statusCode).toEqual(200);
        expect(response.body.gyms).toHaveLength(1);
        expect(response.body.gyms).toEqual([
            expect.objectContaining({
                title: 'Nearby Gym'
            })
        ]);
    })
})