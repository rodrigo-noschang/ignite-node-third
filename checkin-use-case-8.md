# Use Case do Check In
Isso vai ser interessante porque a tabela de checkin está servindo como um pivô entre a tabela de usuários e de academias. Algumas coisas irão mudar na implementação desse caso de uso (e suas dependências). Em um primeiro momento, vamos apenas implementar a função de criar um checkin. Vamos fazer um repositório para o checkin, contendo apenas o método **create**, no `src/repositories/check-ins-repository.ts`:

```js
    import { CheckIn, Prisma } from "@prisma/client";

    export interface CheckInsRepository {
        create(data: Prisma.CheckInUncheckedCreateInput): Promise<CheckIn>
    }
```

Repare que agora tipamos o argumento desse método com o **CheckInUncheckedCreateInput** ao invés do **CheckInCreateInput**. Isso porque, se usássemos apenas o CreateInput, nós teríamos que relacionar usuário e academia com **ENTIDADES** completas de cada tabela, ou seja, precisaríamos de todos os dados de um usuário e todos os dados de uma academia e colocá-los nas chaves **gym** e **user** (além, é claro dos outros dados padrão do checkin: id, created_at e validated_at).

Usando o UncheckedCreateInput, o que faremos é trabalhar **não com as entidades**, mas sim com os **campos relacionais**, ou seja, ao invés de fornecer uma entidade do tipo Gym, e uma entidade do tipo User na criação do checkin, vamos informar apenas **o id** de um usuário e de uma academia, para que eles fiquem relacionados somente através de suas chaves primárias. 

Nesse caso, faremos a ligação de 2 entidades já existentes nas tabelas User e Gym, ao invés de possivelmente criar um deles no momento em que o checkin passa a existir. 

Vamos implementar um **caso de uso** bem básico para o CheckIn, apenas chamaremos o método create do repositório (que ainda não foi implementado), sem aplicar nenhuma regra de negócios. Segue basicamente o formato de todos os outros UseCases:

```js
    import { CheckIn } from "@prisma/client";
    import { CheckInsRepository } from "@/repositories/check-ins-repository";

    interface CheckInUseCaseRequest {
        userId: string
        gymId: string
    }

    interface CheckInUseCaseResponse {
        checkIn: CheckIn
    }

    export class CheckInUseCase {
        constructor(private checkInsRepository: CheckInsRepository) { }

        async execute({ userId, gymId }: CheckInUseCaseRequest): Promise<CheckInUseCaseResponse> {
            const checkIn = await this.checkInsRepository.create({
                user_id: userId,
                gym_id: gymId
            })

            return { checkIn }
        }
    }
```

Nosso repositório em memória também será bastante simples, e não aplicará nenhuma regra de negócio, por enquanto, para podermos desenvolver os testes:

```js
    import { randomUUID } from "node:crypto";
    import { Prisma, CheckIn } from "@prisma/client";
    import { CheckInsRepository } from "../check-ins-repository";

    export class InMemoryCheckInsRepository implements CheckInsRepository {
        private items: CheckIn[] = []

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
```

**Ver arquivo tdd-9.md**

## Vitest - Mocking
O **Mocking** nada mais é do que criar dados fictícios com o propósito de garantir um funcionamento/valor específico para os nossos testes. As funcionalidades do Mocking são várias, mas nesse caso em específico vamos usá-lo para gerar nossas datas de checkin de forma segura. Dentro do nosso `beforeEach`, vamos incluir uma funcionalidade de **vi.useFakeTimers()** (vi é importado do vitest também). Isso vai permitir que todos os nossos testes, modifiquem a data atual do "sistema" que está rodando os testes. 

No nosso teste que verifica a duplicidade de check-ins no mesmo dia, vamos definir uma data para esse sistema que roda os testes:

```js
    it('should not be able to check in twice in the same day', async () => {
        vi.setSystemTime(new Date(2022, 0, 12, 8, 0, 0)); // Modifica a data do sistema

        await sut.execute({
            userId: 'user-01',
            gymId: 'gym-01'
        })

        await expect(() => {
            return sut.execute({
                userId: 'user-01',
                gymId: 'gym-01'
            })
        }).rejects.toBeInstanceOf(Error)
    })
```

Estamos definindo essa data do sistema para 12 de janeiro de 2022 às 8h da manhã. Dessa forma, quando o caso de uso rodar um `new Date()` na criação de check in, vai pegar essa data definida ao invés da data real do dia em que o teste estiver sendo executado. Depois, para garantir que essa configuração não vai alterar outros testes, é interessante incluir um **afterEach** que volta os timers para o tempo real:

```js
    afterEach(() => {
        vi.useRealTimers()
    })
```

## De red para green
Voltando para a verificação da regra de negócio que proíbe 2 checkins do mesmo usuário no mesmo dia:
Já temos um teste que faz essa verificação e está falhando quando tentamos fazer 2 logins, e ele está falhando porque no teste esperamos que essa ação gere um erro, mas como esse não foi criado ainda, o teste está falhando pois essa promise não está sendo rejeitada.

Nosso próximo passo agora, é escrever código o suficiente para para fazer esse teste passar, mas vamos propositalmente fazer ele passar de uma maneira duvidosa. Vamos criar um método no nosso repositório que vai verificar se já existe um checkin daquele usuário naquele mesmo dia:

```js
    export interface CheckInsRepository {
        create(data: Prisma.CheckInUncheckedCreateInput): Promise<CheckIn>
        findUserByIdOnSpecificDate(userId: string, date: Date): Promise<CheckIn | null>
    }
```

Agora, vamos propositalmente criar uma verificação "burra", onde vamos ver apenas se existe um checkin com aquele id de usuário, sem fazer verificação de data:

```js
    // No InMemoryCheckInsRepository

    async findUserByIdOnSpecificDate(userId: string, date: Date) {
        const checkInOnSameDateBySameUser = this.items.find(item => {
            return item.user_id === userId
        });

        if (!checkInOnSameDateBySameUser) return null;

        return checkInOnSameDateBySameUser;
    }
```

E agora, no nosso use case, antes de realizar a criação de um novo checkin, vamos primeiro utilizar esse método acima para ver se já existe um check-in desse usuário, naquela mesma data. Relembrando que, por enquanto, não estamos fazendo verificação sobre a data, apenas o usuário:

```js
    // No CheckInUseCase

    async execute({ userId, gymId }: CheckInUseCaseRequest): Promise<CheckInUseCaseResponse> {
        const checkInOnSameDay = await this.checkInsRepository.findUserByIdOnSpecificDate(
            userId,
            new Date()
        )

        if (checkInOnSameDay) {
            throw new Error();
        }

        const checkIn = await this.checkInsRepository.create({
            user_id: userId,
            gym_id: gymId
        })

        return { checkIn }
    }
```

Rodando nossos testes agora, os testes passarão com sucesso, já que um erro está sendo gerado quando um mesmo usuário faz o checkin 2x. Mas ainda existe algo a ser explorado, como fizemos uma verificação limitada, sem levar em consideração a data, esse usuário JAMAIS conseguiria fazer 2 check-ins, mesmo que em dias diferentes. Dessa forma, já passamos com sucesso da etapa **red** para **green**.

Agora, podemos tentar criar um teste que verifica justamente o que ficou faltando antes, se é possível fazer checkins em dias diferentes, e podemos usar o **vi.useFakeTimers**, em conjunto com o **vi.setSystemTime** para simular esses dias diferentes:

```js
    it('should be able to check in twice in different days', async () => {
        vi.setSystemTime(new Date(2022, 0, 12, 8, 0, 0));
        
        await sut.execute({
            userId: 'user-01',
            gymId: 'gym-01'
        })
        
        vi.setSystemTime(new Date(2022, 0, 13, 8, 0, 0));
        
        await expect(() => {
            return sut.execute({
                userId: 'user-01',
                gymId: 'gym-01'
            });
        }).resolves.toBeTruthy();
    })
```

E agora, conforme dito acima, os testes falharão, indicando que nossa verificação de checkins no mesmo dia está errada. Vamos implementar a verificação de data usando o **dayjs**:

```sh
    $ npm i dayjs
```

Agora vamos criar 2 instâncias do dayjs, uma representando o começo do dia em que queremos criar e checkin (12/01/2022 Às 00:00:00, por exemplo) e outra representando o final desse mesmo dia (12/01/2022 às 23:59:59). A ideia aqui é que possamos verificar se o dia dos nossos checkins estão entre essas duas datas geradas porque, se estiver, aquele checkin foi feito no mesmo dia e, se foi feito pelo mesmo usuário, precisamos interromper a operação.

Agora, dentro do nosso método de busca (o **find**) vamos converter as datas de criação dos checkins em instâncias dayjs e ver se ele estão entre o intervalo definido pelas datas acima. O método fica:

```js
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
```

Rodando os testes agora, tudo deve passar. 

Uma próxima regra de negócio que os checkins devem seguir é o usuário estar a no máximo 100m de distância da academia para poder realizar ele. Para isso, teremos que implementar os dados de distância (latitude e longitude) da própria academia.