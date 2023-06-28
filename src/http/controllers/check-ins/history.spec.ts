import { app } from '@/app';
import request from 'supertest';
import { prisma } from '@/lib/prisma';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createAndAuthenticateUser } from '@/utils/test/create-and-authenticate-user';

describe('Check In History Controller (e2e)', () => {
    beforeAll(async () => {
        await app.ready();
    })

    afterAll(async () => {
        await app.close();
    })


    it('should be able to get user check-in history', async () => {
        const { token } = await createAndAuthenticateUser(app);

        const user = await prisma.user.findFirstOrThrow();

        const gym = await prisma.gym.create({
            data: {
                title: 'Javascript Gym',
                description: 'Some gym',
                phone: '9999999999',
                latitude: -23.9118092,
                longitude: -52.3413882,
            }
        })

        await prisma.checkIn.createMany({
            data: [
                {
                    user_id: user.id,
                    gym_id: gym.id
                },
                {
                    user_id: user.id,
                    gym_id: gym.id
                }
            ]
        });


        const response = await request(app.server)
            .get('/check-ins/history')
            .set('Authorization', `Bearer ${token}`)
            .send()

        expect(response.statusCode).toEqual(200);
        expect(response.body.checkIns).toHaveLength(2);
        expect(response.body.checkIns).toEqual([
            expect.objectContaining({
                user_id: user.id,
                gym_id: gym.id
            }),
            expect.objectContaining({
                user_id: user.id,
                gym_id: gym.id
            })
        ]);
    })
})