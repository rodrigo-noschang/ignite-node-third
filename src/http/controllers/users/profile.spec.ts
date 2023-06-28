import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/test/create-and-authenticate-user';
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
        const { token } = await createAndAuthenticateUser(app);

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