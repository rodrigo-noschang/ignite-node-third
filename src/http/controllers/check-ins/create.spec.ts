import { app } from '@/app';
import request from 'supertest';
import { prisma } from '@/lib/prisma';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createAndAuthenticateUser } from '@/utils/test/create-and-authenticate-user';

describe('Create Check In Controller (e2e)', () => {
    beforeAll(async () => {
        await app.ready();
    })

    afterAll(async () => {
        await app.close();
    })


    it('should be able to check into a gym', async () => {
        const { token } = await createAndAuthenticateUser(app);

        const gym = await prisma.gym.create({
            data: {
                title: 'Javascript Gym',
                description: 'Some gym',
                phone: '9999999999',
                latitude: -23.9118092,
                longitude: -52.3413882,
            }
        })

        const response = await request(app.server)
            .post(`/gyms/${gym.id}/check-ins`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                userLatitude: -23.9118092,
                userLongitude: -52.3413882,
            })

        expect(response.statusCode).toEqual(201);
    })
})