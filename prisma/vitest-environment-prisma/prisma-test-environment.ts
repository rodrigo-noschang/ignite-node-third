import 'dotenv/config';
import { Environment } from 'vitest';
import { randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

function generateSchemaURL(schema: string) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) throw new Error('Inform a DATABASE_URL on environment variables');

    const url = new URL(databaseUrl);
    url.searchParams.set('schema', schema);

    return url.toString();
}

export default <Environment>{
    name: 'prisma',
    async setup() {
        const schema = randomUUID();
        const url = generateSchemaURL(schema);

        process.env.DATABASE_URL = url;

        execSync('npx prisma migrate deploy');

        return {
            async teardown() {
                const prisma = new PrismaClient();

                await prisma.$executeRawUnsafe(
                    `DROP SCHEMA IF EXISTS "${schema}" CASCADE`
                );

                await prisma.$disconnect();
            }
        }
    }
}