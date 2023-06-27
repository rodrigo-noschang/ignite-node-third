import { FastifyInstance } from "fastify";

import { profile } from "./profile";
import { register } from "./register";
import { authenticate } from "./authenticate";

import { verifyJWT } from "@/http/middlewares/verify-jwt";

export async function usersRoutes(app: FastifyInstance) {
    app.post('/users', register);
    app.post('/sessions', authenticate);

    app.get('/me', { onRequest: [verifyJWT] }, profile)
}