import { z } from "zod";
import { FastifyRequest, FastifyReply } from "fastify";

import { registerUseCase } from "../use-cases/register";

export async function register(request: FastifyRequest, reply: FastifyReply) {
    const registerBodySchema = z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(6)
    });

    const { name, email, password } = registerBodySchema.parse(request.body);

    try {
        await registerUseCase({ name, email, password })

    } catch (error: any) {
        return reply.status(409).send({
            message: error.message
        })
    }

    return reply.status(201).send();
}