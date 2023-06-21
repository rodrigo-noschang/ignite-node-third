import dayjs from "dayjs";
import { randomUUID } from "node:crypto";
import { Prisma, CheckIn } from "@prisma/client";

import { CheckInsRepository } from "../check-ins-repository";

export class InMemoryCheckInsRepository implements CheckInsRepository {
    private items: CheckIn[] = []

    async findUserByIdOnSpecificDate(userId: string, date: Date) {
        const startOfDay = dayjs(date).startOf('date');
        const endOfDay = dayjs(date).endOf('date');

        const checkInOnSameDateBySameUser = this.items.find(item => {
            const checkInDate = dayjs(item.created_at);
            const isOnSameDate = checkInDate.isAfter(startOfDay) && checkInDate.isBefore(endOfDay);

            return item.user_id === userId && isOnSameDate
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