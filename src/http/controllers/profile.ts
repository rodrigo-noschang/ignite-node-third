import { FastifyRequest, FastifyReply } from 'fastify';

export async function profile(request: FastifyRequest, reply: FastifyReply) {
    await request.jwtVerify();

    const userId = request.user.sub;
    console.log(userId);

    return reply.send();
}