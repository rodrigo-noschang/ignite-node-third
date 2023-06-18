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

## Inversão de Dependência
Apesar dessa separação de camadas que estamos aplicando nos permitir isolar uma camada da outra, se um dia decidíssemos trocar o banco de dados, ou o orm utilizado, teríamos que fazer mudanças manuais e demoradas em todos os nossos casos de uso, já que eles estão diretamente **dependentes** do repositório do Prisma. Sendo assim precisaríamos mudar todos esses métodos 1 por 1.

É agora que vamos começar a explorar o **SOLID**, mais especificamente, o D (Dependency Inversion Principle). Agora, ao invés de instanciarmos uma classe do nosso repositório diretamente nos **use-cases**, vamos passar essa instância (esse repositório) para ele como o argumento do construtor de sua classe. Vamos alterar o use-cases para o seguinte:

```js
    export class RegisterUseCase {
        constructor(private userRepository: any) { }

        async execute({ name, email, password }: registerUseCaseParams) {
            const password_hash = await hash(password, 6);

            await this.userRepository.findByEmail(email);

            await this.userRepository.create({
                name,
                email,
                password_hash
            })
        }
    }
```

Agora recebemos um repositório como parâmetro no construtor, e esse repositório pode ser um repositório do Prisma, ou qualquer tipo de orm, ou query builder, ou o que quer que seja, e esse repositório pode também estar fazendo acesso a qualquer tipo de banco de dados, que não vai alterar em nada o funcionamento do nosso código. 

A grande diferença agora é que precisamos acessar esse método de forma diferente: no nosso controller, precisamos criar a instância desse repositório e passá-lo na construção esse novo use-case, e só então poderemos rodar o `execute` para então realizar o acesso ao banco de dados com esse repositório que definimos.

```js
    try {
        const prismaUsersRepository = new PrismaUsersRepository();
        const registerUseCase = new RegisterUseCase(prismaUsersRepository);

        await registerUseCase.execute({ name, email, password })

    } catch (error: any) {
        return reply.status(409).send({
            message: error.message
        })
    }
```

Agora nosso controller fica assim, ao invés de chamarmos a função do use-case de uma única vez, primeiro criamos o repositório do Prisma (ou, futuramente, se isso mudar, criamos o repositório que será usado), e passamos ele como parâmetro do RegisterUseCase. 

É importante notar duas coisas agora:

- 1) Os UseCases devem possuir apenas um método principal (um execute, handle ou qualquer coisa do tipo), então teremos um use-case para a criação de um novo recurso, para a leitura de todos eles, para a busca de um único, deleção, etc.

- 2) Todos os nossos use-cases não mudarão daqui pra frente, então se o RegisterUseCase faz uso do método **repository.create** para inserir um novo registro no banco de dados, é importante que todos os outros repositórios sigam essa mesma nomenclatura que eles possa ser facilmente intercambiáveis entre si. Se um repositório tiver esse método definido como create, e outro como insert, por exemplo, e o use-case chamar essa método como create, então teremos problemas de acoplamento. 

Fazendo toda essa abstração, nossa tipagem acabou ficando muito fraca e, junto com ela, o intellisense tbm. Vamos começar definindo quais são os métodos que deverão existir no nosso repositório. Aqui faremos uma interface contendo todos os métodos que as classes de repositório devem **implementar**, no arquivo `src/repositories/users-repository.ts` 

```ts
    import { Prisma, User } from "@prisma/client";

    export interface UsersRepository {
        findByEmail(email: string): Promise<User | null>
        create(data: Prisma.UserCreateInput): Promise<User>
    }
```

Agora, no nosso repositório, ao invés de criar uma classe completamente nova, vamos dizer que ela **implementa** o  UserRepository, todo o restante permanece o mesmo:

```js
    import { UsersRepository } from "./users-repository";

    export class PrismaUsersRepository implements UsersRepository {
        ...
    }
```

Agora, além da sugestão do que deve ser implementado, se deixarmos de implementar algum método, teremos um aviso de erro. Além disso, no nosso use-case, vamos trocar a tipagem do argumento do construtor pelo UserRepository:

```js
    export class RegisterUseCase {
        (private userRepository: UsersRepository) { }
        ...
    }
```

Agora nossa tipagem fica mais fácil tanto para os métodos, quanto para os dados que serão passados neles.

Só pra definir o fluxo da aplicação: nossa requisição http é recebida no `app.ts`, que registra nossas rotas no `http/routes.ts`, essas rotas já chamam diretamente o **Controller** da nossa aplicação. Como não podemos garantir que nossa aplicação será SEMPRE usada pela web, ou seja, por requisições http, não podemos implementar todas as nossas funcionalidades aqui, então o passo a passo da aplicação é implementado no que chamamos de **Casos de Uso**.

Esses casos de uso implementam algumas verificações e funcionalidades como verificar se o email é duplicado, encriptar a senha (note que esses passos devem ser executados sempre que alguém for criar um novo usuário, independente se essa criação está sendo feita via web ou não) etc e faz acesso ao banco de dados. Porém, como não podemos garantir que SEMPRE usaremos um banco de dados Postgres, e sempre usaremos o Prisma como ORM, vamos realizar esse acesso ao banco de dados através do que chamamos de **Repositories**. 

Esses repositórios podem ser de qualquer tipo e jeito, por isso, passamos eles como dependência para os nossos casos de uso, por isso, la atrás, antes do controller poder chamar o caso de usos, ele precisa criar uma instância de repositório e passar para o caso de uso como um parâmetro na sua criação. Para garantir que todos os repositórios vão sempre ter os mesmos métodos com a mesma nomenclatura e mesmos parâmetros e retornos, criamos uma interface no arquivo `repositories/users-repositories` e forçamos todos os repositories a implementar essa interface usando a palavra-chave **implements**.  

Para facilitar e garantir algumas coisas, passamos essa mesma interface para o constructor do nosso caso de usos, para que possamos respeitar as regras desse contrato (dessa interface) e também ter a facilidade do intellisense. 

Então segue **Req. HTTP** -> **app** -> **Routes** -> **Controller** -> cria instância do **Repository** e passa ela para o -> **Use Cases** que vai usá-lo no seu construtor. 