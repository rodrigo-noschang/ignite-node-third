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