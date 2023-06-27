import { z } from "zod";
import { FastifyReply, FastifyRequest } from "fastify";

import { makeFetchNearbyGymUseCase } from "@/use-cases/factories/make-fetch-nearby-gym-use-case";

export async function nearby(request: FastifyRequest, reply: FastifyReply) {
    const nearByGymsQuerySchema = z.object({
        latitude: z.number().refine(value => {
            return Math.abs(value) <= 90;
        }),
        longitude: z.number().refine(value => {
            return Math.abs(value) <= 180
        })
    })

    const { latitude, longitude } = nearByGymsQuerySchema.parse(request.body);

    const nearbyGymsUseCase = makeFetchNearbyGymUseCase();

    const { gyms } = await nearbyGymsUseCase.execute({
        userLatitude: latitude,
        userLongitude: longitude
    })

    return reply.send({ gyms })
}