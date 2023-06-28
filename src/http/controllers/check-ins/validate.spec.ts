import { app } from '@/app';
import request from 'supertest';
import { prisma } from '@/lib/prisma';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createAndAuthenticateUser } from '@/utils/test/create-and-authenticate-user';

describe('Validate Check In Controller (e2e)', () => {
    beforeAll(async () => {
        await app.ready();
    })

    afterAll(async () => {
        await app.close();
    })


    it('should be able to validate check-in', async () => {
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

        const checkIn = await prisma.checkIn.create({
            data: {
                user_id: user.id,
                gym_id: gym.id
            }
        });

        const response = await request(app.server)
            .patch(`/check-ins/${checkIn.id}/validate`)
            .set('Authorization', `Bearer ${token}`)
            .send()

        const validatedCheckIn = await prisma.checkIn.findUniqueOrThrow({
            where: {
                id: checkIn.id
            }
        });

        expect(response.statusCode).toEqual(204);
        expect(validatedCheckIn.validated_at).toEqual(expect.any(Date));
    })
})