import { Gym, Prisma } from "@prisma/client";

export interface FindManyNearbyRequest {
    userLatitude: number,
    userLongitude: number
}

export interface GymsRepository {
    findById(id: string): Promise<Gym | null>
    create(data: Prisma.GymCreateInput): Promise<Gym>
    findManyNearby(userCoordinates: FindManyNearbyRequest): Promise<Gym[]>
    searchMany(search: string, page: number): Promise<Gym[]>
}