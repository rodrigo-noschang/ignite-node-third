import { makeGetUserProfileUseCase } from '@/use-cases/factories/make-get-user-profile-use-case';
import { FastifyRequest, FastifyReply } from 'fastify';

export async function profile(request: FastifyRequest, reply: FastifyReply) {
    await request.jwtVerify();
    const userId = request.user.sub;

    const getUserProfile = makeGetUserProfileUseCase();

    const { user } = await getUserProfile.execute({
        userId
    })

    return reply.send({
        user: {
            ...user,
            password_hash: undefined
        }
    });
}