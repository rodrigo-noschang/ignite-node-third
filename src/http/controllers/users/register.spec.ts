import { app } from "@/app";
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe('Register Controller (e2e)', () => {
    beforeAll(async () => {
        await app.ready()
    });

    afterAll(async () => {
        await app.close()
    });

    it('should be able to register', async () => {
        const response = await request(app.server)
            .post('/users')
            .send({
                name: 'John Doe',
                email: 'johndoe@mail.com',
                password: '123456'
            })

        expect(response.statusCode).toEqual(201);
    })
})