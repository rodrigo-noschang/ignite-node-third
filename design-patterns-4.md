# Desenvolvendo com Design Pattern

## Criando Controllers
Nessa aplicação, vamos começar a desenvolver ela toda de forma mais organizada, a começar pelo uso dos **controllers**. Entenderemos por controller a função que é responsável por lidar com a requisição http em si. No nosso caso, vai ser toda a função que é executada dentro daquela rota, portanto vamos isolar ela. Antes, o que tínhamos era uma rota de criação de usuário, por exemplo, toda definida no próprio arquivo `app.ts`:

```ts
    export const app = fastify();

    app.post('/users', async (request, reply) => {
        const registerBodySchema = z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string().min(6)
        });

        const { name, email, password } = registerBodySchema.parse(request.body);

        await prisma.user.create({
            data: {
                name,
                email,
                password_hash: password
            }
        });

        return reply.status(201).send();
    })
```

O que vamos fazer agora é pegar toda essa função que é executada nessa rota e jogar pra dentro de outro arquivo que vai conter nossos controllers. Como essa função é de cadastro de usuário, jogarei ela para dentro de `src/http/controllers/register.ts`:

```ts
    export async function register(request: FastifyRequest, reply: FastifyReply) {
        const registerBodySchema = z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string().min(6)
        });

        const { name, email, password } = registerBodySchema.parse(request.body);

        await prisma.user.create({
            data: {
                name,
                email,
                password_hash: password
            }
        });

        return reply.status(201).send();
    }
```

E também, como já tínhamos feito antes, vamos usar um plugin de rotas para o app, onde definiremos a rota que vai fazer uso desse controller no `src/http/routes.ts`:

```ts
    export async function appRoutes(app: FastifyInstance) {
        app.post('/users', register)
    }
```

E no `app.ts`, simplesmente faremos o registro desse plugin de rotas:

```ts
    export const app = fastify();

    app.register(appRoutes);
```

Apesar de já termos uma boa separação de funcionalidades aqui, ainda estamos limitando a nossa criação de usuário pelo controller. Por "criação de usuário" entende-se inserção do novo usuário no banco de dados. Da forma atual, só podemos inserir um novo usuário ao banco de dados através de uma requisição HTTP, nessa mesma rota. Porém, é comum conforme o avanço das aplicações que queiramos, por exemplo, expandir as formas de cadastro de novos usuários, academias, etc, portanto seria importante também fazer uma separação desse processo de criação/inserção de um novo usuário.

## Use-case ou Services
Agora vamos retirar do nosso controller a parte de criação de usuário, conforme citado acima, para que ela possa ser feita independente do meio que nosso usuário final está operando a aplicação. Colocaremos essa **camada** em uma pasta chamada `services`, ou `use-case`. Nela, vamos fazer apenas os passos que, ao nosso ver, deve ser feito em todo processo de criação de usuário, independente de onde esse "pedido" venha. 

Sabemos que, sempre que um usuário novo for cadastrado precisamos (1) criptografar sua senha e (2) inserir ele no banco de dados. Portanto, no arquivo `src/use-cases/register.ts` criaremos a função que faz exatamente isso:

```js
    interface registerUseCaseParams {
        name: string,
        email: string,
        password: string,
    }

    export async function registerUseCase({ name, email, password }: registerUseCaseParams) {
        const password_hash = await hash(password, 6);

        const emailAlreadyExists = await prisma.user.findUnique({
            where: { email }
        })

        if (emailAlreadyExists) {
            throw new Error('email already exists');
        }

        await prisma.user.create({
            data: {
                name,
                email,
                password_hash
            }
        });
    }
```

Como essa função gera um erro, vamos chamá-la dentro de um try/catch lá no nosso controller que agora fica dessa forma:
```js
    export async function register(request: FastifyRequest, reply: FastifyReply) {
        const registerBodySchema = z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string().min(6)
        });

        const { name, email, password } = registerBodySchema.parse(request.body);

        try {
            await registerUseCase({ name, email, password })

        } catch (error: any) {
            return reply.status(409).send({
                message: error.message
            })
        }

        return reply.status(201).send();
    }
```

Essa é uma versão bastante introdutória e rudimentar desse pattern, mas já pode-se notar a ideia de separação de camadas. A ideia, aparentemente, é deixar nessa camada todos os processos não só de acesso ao banco de dados, como também TODAS as funções que devem ser realizadas antes desse determinado acesso ao banco de dados. Quase como se nós fôssemos definir manualmente algumas funções ou verificações "@default". Até mesmo por esse motivo que trouxemos o método de criptografia para essa camada pois, independente do meio em que a senha do usuário é enviada, ela PRECISA ser criptografada antes de ser inserida no banco de dados.

Vamos fazer ainda mais uma separação nessa estrutura, que será a responsável por fazer EXCLUSIVAMENTE o acesso ao banco de dados, faremos os tal **repositories**

## Repositories
A ideia dos repositories é criar, a princípio, uma classe com métodos que servirão como uma porta de entrada para qualquer operação a ser feita no banco de dados (qualquer query). Portanto, todas as operações do banco de dados passarão por esses caras. No momento, a utilidade disso ainda não fica muito claro, mas tenhamos fé no Diegão.

Uma das vantagens que já podemos destacar imediatamente é que se, futuramente, quisermos ou precisarmos mudar de banco de dados, ou mudar a forma que acessamos esse banco de dados, para um query builder, ou até mesmo driver nativo, fica muito mais fácil alterar apenas os repositórios, do que na aplicação inteira. Vamos implementar nosso primeiro repositório, para os Users, no arquivo `src/repositories/prisma-users-repository.ts`:

```js
    import { prisma } from "@/lib/prisma";
    import { Prisma } from "@prisma/client";

    export class PrismaUsersRepository {
        async create(data: Prisma.UserCreateInput) {
            const user = await prisma.user.create({
                data
            });

            return user;
        }
    }
```

Aqui apenas criamos e exportamos uma classe com o nome do repositório para os Users, portanto, aqui estarão todos os métodos que fazem acesso ao banco de dados na tabela Users. No método create dessa classe, trazemos a query de inserção na tabela users, até aqui nada novo. O que mais chama atenção aqui é, certamente, a tipagem do `data`. Essa tipagem vem diretamente do client do Prisma, e é gerada automaticamente por ele baseado na modelagem que fizemos na nossa tabela. 

Assim como existe uma tipagem para os dados de criação do usuário, também existe um tipo para praticamente todos os métodos CRUD nessa tabela, como o update (que é meio que o único método que precisa de um input tbm).

Agora, no nosso register do `use-cases`, ao invés de inserir esses dados no db, vamos criar uma instância da classe do repositório, e aí então executar essa função:

```ts
    const prismaUsersRepository = new PrismaUsersRepository();

    await prismaUsersRepository.create({
        name,
        email,
        password_hash
    })
``` 