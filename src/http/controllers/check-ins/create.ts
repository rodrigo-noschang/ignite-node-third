import { z } from "zod";
import { FastifyReply, FastifyRequest } from "fastify";

import { makeCheckInUseCase } from "@/use-cases/factories/make-check-in-use-case";

export async function create(request: FastifyRequest, reply: FastifyReply) {
    const createCheckinParamsSchema = z.object({
        gymId: z.string().uuid()
    });

    const createCheckInBodySchema = z.object({
        userLatitude: z.number().refine(value => {
            return Math.abs(value) <= 90;
        }),
        userLongitude: z.number().refine(value => {
            return Math.abs(value) <= 180
        })
    });

    const { gymId } = createCheckinParamsSchema.parse(request.params);
    const { userLatitude, userLongitude } = createCheckInBodySchema.parse(request.body);
    const userId = request.user.sub;

    const checkInUseCase = makeCheckInUseCase();

    await checkInUseCase.execute({
        gymId,
        userId,
        userLatitude,
        userLongitude
    })

    return reply.status(201).send()
}