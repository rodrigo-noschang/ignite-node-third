import { FastifyRequest, FastifyReply } from "fastify";

import { makeGetUserMetricsUseCase } from "@/use-cases/factories/make-get-user-metrics-use-case";

export async function metrics(request: FastifyRequest, reply: FastifyReply) {

    const userMetricsUseCase = makeGetUserMetricsUseCase();

    const { checkInsCount } = await userMetricsUseCase.execute({
        userId: request.user.sub
    });

    return reply.status(200).send({ checkInsCount })
}