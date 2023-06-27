import { Environment } from 'vitest';

export default <Environment>{
    name: 'prisma',
    async setup() {
        console.log('Executou no início dos testes');

        return {
            teardown() {
                console.log('Executou no final dos testes');
            }
        }
    }
}