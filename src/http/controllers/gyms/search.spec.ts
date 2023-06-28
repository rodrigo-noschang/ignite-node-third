import { app } from "@/app";
import request from 'supertest';
import { afterAll, beforeAll, describe, it, expect } from "vitest";

import { createAndAuthenticateUser } from "@/utils/test/create-and-authenticate-user";

describe('Search Gyms Controller (e2e)', () => {
    beforeAll(async () => {
        await app.ready();
    })

    afterAll(async () => {
        await app.close();
    })

    it('should be able to search for gyms', async () => {
        const { token } = await createAndAuthenticateUser(app);

        await request(app.server)
            .post('/gyms')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Javascript Gym',
                description: 'Some gym',
                phone: '9999999999',
                latitude: -23.9118092,
                longitude: -52.3413882,
            });

        await request(app.server)
            .post('/gyms')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Typescript Gym',
                description: 'Some gym',
                phone: '9999999999',
                latitude: -23.9118092,
                longitude: -52.3413882,
            });

        const response = await request(app.server)
            .get('/gyms/search')
            .query({
                q: 'Javascript'
            })
            .set('Authorization', `Bearer ${token}`)
            .send();

        expect(response.statusCode).toEqual(200);
        expect(response.body.gyms).toHaveLength(1);
        expect(response.body.gyms).toEqual([
            expect.objectContaining({
                title: 'Javascript Gym'
            })
        ]);
    })
})