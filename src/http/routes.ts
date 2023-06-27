import { FastifyInstance } from "fastify";

import { profile } from "./controllers/profile";
import { register } from "./controllers/register";
import { authenticate } from "./controllers/authenticate";

export async function appRoutes(app: FastifyInstance) {
    app.post('/users', register);
    app.post('/sessions', authenticate);

    app.get('/me', profile)
}