import { z } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';

import { InvalidCredentialsError } from '@/use-cases/errors/invalid-credentials-error';
import { makeAuthenticateUserCase } from '@/use-cases/factories/make-authenticate-user-case';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    const authenticateBodySchema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
    })

    const { email, password } = authenticateBodySchema.parse(request.body);

    try {
        const authenticateUseCase = makeAuthenticateUserCase();

        const { user } = await authenticateUseCase.execute({
            email,
            password
        });

        const token = await reply.jwtSign({}, {
            sign: {
                sub: user.id
            }
        });

        return reply.send({
            token
        })
    } catch (error) {
        if (error instanceof InvalidCredentialsError) {
            return reply.status(400).send({
                message: error.message
            });
        }

        throw error;
    }
}