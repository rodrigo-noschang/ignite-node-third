# Gym Implementation

Agora vamos implementar algumas funcionalidades das academias para poder prosseguir com a criação dos testes dos checkins, que dependem da distância do usuário da academia. Vamos começar criando um os repositórios da academia, tanto a **interface quanto o repositório em memória**.

Interface
```js
    import { Gym } from "@prisma/client";

    export interface GymsRepository {
        findById(id: string): Promise<Gym | null>
    }
```

Repositório em memória, por enquanto, vai ter somente um findById:
```js
    import { Gym } from "@prisma/client";

    import { GymsRepository } from "../gyms-repository";

    export class InMemoryGymsRepository implements GymsRepository {
        public items: Gym[] = [];

        async findById(id: string) {
            const gym = this.items.find(gym => gym.id === id);

            if (!gym) return null;

            return gym;
        }
    }
```

Tudo bem semelhante ao que já foi feito nas outras entidades do banco.

Agora, voltando ao método da criação do checkin, além de fazer as verificações que já fazemos, que incluem a existência do usuário e se esse usuário já fez um checkin nesse mesmo dia, também precisamos, obviamente, ver se a academia com aquele id existe. Portanto, lá no use-case dos check-ins vamos utilizar esse método de findById do repositório das academias. Mas, repare bem, que esse método de procura por id das academias existem somente no repositório das academias, portanto agora será necessário passar esse outro repositório para dentro do UseCases do Checkin também. 

```js
export class CheckInUseCase {
    constructor(
        private checkInsRepository: CheckInsRepository,
        private gymsRepository: GymsRepository
    ) { }

    async execute({ userId, gymId }: CheckInUseCaseRequest): Promise<CheckInUseCaseResponse> {
        const gym = await this.gymsRepository.findById(gymId);

        if (!gym) {
            throw new ResourceNotFoundError();
        }
    ...
}
```

Também precisaremos alterar isso nos nossos testes que, por enquanto, só recebem o repositório dos checkins. E claro, para validar que uma academia existe, precisamos antes criar uma, então podemos implementar o método **create** no repositório dela, ou também fazer um simples push no array de **items** desse repositório, já que esse dado e esse repositório são usados somente para os testes.

Um questionamento que me surgiu durante esse processo foi "Por que, no momento em que vamos criar o checkin, o método de verificação de existência da academia foi feita no repositório da academia e as verificações referentes ao usuário foram feitas direto no repositório do checkin, e não no do usuário?"

Uma reposta que achei convincente, porém não sei se está correta é: A academia, nesse momento é uma entidade que existe (ou existiria) por si só, ou seja, por enquanto basta que uma academia exista para que possamos realizar o checkin. Já para o usuário, verificamos uma regra de negócio: aquele determinado usuário não poderia ter outro checkin realizado naquele mesmo dia. Para obter esse dado, precisamos dos registros de checkin, que PRECISAM ser obtidos no repositório dos Check Ins. Se bastasse a existência do usuário, poderíamos ter reaproveitado algum método de **findById** no repositório de usuários. 

Futuramente, precisaremos também comparar as latitudes e longitudes tanto do usuário quanto da academia. Da academia, já podemos obter esses dados diretamente do método findById. Do usuário, porém, ainda não definimos como isso será obtido, mas se isso fosse (ou vier a ser) um dado existente na entidade do usuário, é possível que tenhamos que passar o **UserRepository** como dependência do CheckInUseCases também.

## Caso de Uso da academia
Para o caso de uso de academia, assim como o método create do repositório em memória, teremos pouquíssimas regras de negócio, apenas algumas dorezinhas de cabeça com os tipos de dados para que o Prisma reconheça tudo certinho:

Repositório
```js
    async create(data: Prisma.GymCreateInput) {
        const gym = {
            id: randomUUID(),
            title: data.title,
            latitude: new Prisma.Decimal(data.latitude.toString()),
            longitude: new Prisma.Decimal(data.longitude.toString()),
            phone: data.phone ?? null,
            description: data.description ?? null,
        }

        this.items.push(gym);
        return gym;
    }
```

Caso de uso:
```js
    import { GymsRepository } from "@/repositories/gyms-repository"
    import { Gym } from "@prisma/client"

    interface CreateGymUseCaseRequest {
        title: string,
        description: string | null
        phone: string | null
        latitude: number
        longitude: number
    }

    interface CreateGymUseCaseResponse {
        gym: Gym
    }

    export class CreateGymUseCase {
        constructor(private gymsRepository: GymsRepository) { }

        async execute({
            title,
            description,
            phone,
            latitude,
            longitude
        }: CreateGymUseCaseRequest): Promise<CreateGymUseCaseResponse> {

            const gym = await this.gymsRepository.create({
                title,
                description,
                phone,
                latitude,
                longitude
            })

            return { gym }
        }
    }
```

E agora para os testes:
