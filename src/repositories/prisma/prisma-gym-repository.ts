import { Gym, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { FindManyNearbyRequest, GymsRepository } from "../gyms-repository";

export class PrismaGymsRepository implements GymsRepository {
    async findById(id: string) {
        const gym = await prisma.gym.findUnique({
            where: {
                id
            }
        })

        return gym;
    }

    async create(data: Prisma.GymCreateInput) {
        const newGym = await prisma.gym.create({
            data
        })

        return newGym;
    }

    async findManyNearby({ userLatitude, userLongitude }: FindManyNearbyRequest) {
        const gyms = await prisma.$queryRaw<Gym[]>`
            SELECT * from gyms
            WHERE ( 6371 * acos( cos( radians(${userLatitude}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${userLongitude}) ) + sin( radians(${userLatitude}) ) * sin( radians( latitude ) ) ) ) <= 10
        `

        return gyms;
    }

    async searchMany(search: string, page: number) {
        const gyms = await prisma.gym.findMany({
            where: {
                title: {
                    contains: search
                }
            },
            take: 20,
            skip: (page - 1) * 20
        })

        return gyms;
    }

}