import { z } from "zod";
import { FastifyReply, FastifyRequest } from "fastify";

import { makeSearchGymUseCase } from "@/use-cases/factories/make-search-gym-use-case";

export async function search(request: FastifyRequest, reply: FastifyReply) {
    const searchGymsQuerySchema = z.object({
        q: z.string(),
        page: z.coerce.number().min(1).default(1)
    })

    const { q, page } = searchGymsQuerySchema.parse(request.query);

    const searchGymsUseCase = makeSearchGymUseCase();

    const { gyms } = await searchGymsUseCase.execute({
        search: q,
        page,
    })

    return reply.send({ gyms })
}