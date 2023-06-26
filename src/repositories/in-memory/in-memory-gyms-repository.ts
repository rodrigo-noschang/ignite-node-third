import { randomUUID } from "node:crypto";
import { Gym, Prisma } from "@prisma/client";

import { GymsRepository } from "../gyms-repository";
import { FindManyNearbyRequest } from "../gyms-repository";

import { getDistanceBetweenCoordinates } from "@/utils/get-distance-between-coordinates";

export class InMemoryGymsRepository implements GymsRepository {
    public items: Gym[] = [];

    async findManyNearby({ userLatitude, userLongitude }: FindManyNearbyRequest) {
        const nearByGyms = this.items.filter(gym => {
            const distance = getDistanceBetweenCoordinates(
                { latitude: userLatitude, longitude: userLongitude },
                { latitude: gym.latitude.toNumber(), longitude: gym.longitude.toNumber() }
            )

            return distance < 10;
        })

        return nearByGyms;
    }

    async findById(id: string) {
        const gym = this.items.find(gym => gym.id === id);
        if (!gym) return null;

        return gym;
    }

    async searchMany(search: string, page: number) {
        const gyms = this.items.filter(gym => {
            return gym.title.includes(search);
        })
            .slice((page - 1) * 20, page * 20);

        return gyms;
    }

    async create(data: Prisma.GymCreateInput) {
        const gym = {
            id: data.id ?? randomUUID(),
            title: data.title,
            latitude: new Prisma.Decimal(data.latitude.toString()),
            longitude: new Prisma.Decimal(data.longitude.toString()),
            phone: data.phone ?? null,
            description: data.description ?? null,
        }

        this.items.push(gym);
        return gym;
    }
}