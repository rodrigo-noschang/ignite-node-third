import dayjs from "dayjs";
import { Prisma, CheckIn } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CheckInsRepository } from "../check-ins-repository";

export class PrismaCheckInsRepository implements CheckInsRepository {
    async countByUserId(userId: string) {
        const count = await prisma.checkIn.count({
            where: {
                user_id: userId
            }
        })

        return count;
    }

    async create(data: Prisma.CheckInUncheckedCreateInput) {
        const checkIn = await prisma.checkIn.create({
            data
        })

        return checkIn;
    }

    async findById(id: string) {
        const checkIn = await prisma.checkIn.findUnique({
            where: {
                id
            }
        })

        return checkIn;
    }

    async findManyByUserId(userId: string, page: number) {
        const checkins = await prisma.checkIn.findMany({
            where: {
                user_id: userId
            },
            take: 20,
            skip: (page - 1) * 20
        })

        return checkins;
    }

    async findUserByIdOnSpecificDate(userId: string, date: Date) {
        const startOfDay = dayjs(date).startOf('date');
        const endOfDay = dayjs(date).endOf('date');

        const checkIn = await prisma.checkIn.findFirst({
            where: {
                user_id: userId,
                created_at: {
                    gte: startOfDay.toDate(),
                    lte: endOfDay.toDate()
                }
            }
        })

        return checkIn;
    }

    async save(checkIn: CheckIn) {
        const updatedCheckIn = await prisma.checkIn.update({
            where: {
                id: checkIn.id
            },
            data: checkIn
        })

        return updatedCheckIn;
    }
}