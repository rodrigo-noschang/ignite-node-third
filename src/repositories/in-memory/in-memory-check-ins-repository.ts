import { randomUUID } from "node:crypto";
import { Prisma, CheckIn } from "@prisma/client";
import { CheckInsRepository } from "../check-ins-repository";

export class InMemoryCheckInsRepository implements CheckInsRepository {
    private items: CheckIn[] = []

    async findUserByIdOnSpecificDate(userId: string, date: Date) {
        const checkInOnSameDateBySameUser = this.items.find(item => {
            return item.user_id === userId
        });

        if (!checkInOnSameDateBySameUser) return null;

        return checkInOnSameDateBySameUser;
    }

    async create(data: Prisma.CheckInUncheckedCreateInput): Promise<CheckIn> {
        const { user_id, gym_id } = data;

        const checkIn: CheckIn = {
            id: randomUUID(),
            user_id,
            gym_id,
            created_at: new Date(),
            validated_at: data.validated_at ? new Date(data.validated_at) : null
        }

        this.items.push(checkIn);

        return checkIn;
    }
}