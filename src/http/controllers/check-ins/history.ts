import { z } from "zod";
import { FastifyRequest, FastifyReply } from "fastify";

import { makeFetchUserCheckInsHistoryUseCase } from "@/use-cases/factories/make-fetch-user-check-ins-history-use-case";

export async function history(request: FastifyRequest, reply: FastifyReply) {
    const checkInHistoryParamSchema = z.object({
        page: z.coerce.number().min(1).default(1)
    })

    const { page } = checkInHistoryParamSchema.parse(request.params);

    const checkInHistoryUseCase = makeFetchUserCheckInsHistoryUseCase();

    const { checkIns } = await checkInHistoryUseCase.execute({
        page,
        userId: request.user.sub
    });

    return reply.status(200).send({ checkIns })
}