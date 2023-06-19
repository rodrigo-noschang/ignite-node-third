# Factory Pattern
Uma coisa que já ficou evidente nos nossos processos é que, sempre que vamos utilizar os casos de uso precisamos instanciar suas dependências, seja nos testes ou na aplicação de fato. Enquanto tempos poucos testes e poucas dependências, não é um problema tão grande, mas podemos antecipar, pelo tamanho da aplicação, que isso vai escalar em breve. Para facilitar nossa vida nesse ponto, faremos uso das **Factories Pattern**. 

A ideia aqui é bastante simples, é criar uma única função que instancia nossos casos de uso passando todas as suas dependências. Vamos implementar isso no `src/use-cases/factories/make-register-use-case.ts`

```js
    import { RegisterUseCase } from "../register";
    import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";

    export function makeRegisterUseCase() {
        const usersRepository = new PrismaUsersRepository();
        const registerUseCase = new RegisterUseCase(usersRepository);

        return registerUseCase;
    }
```

Agora, quando formos usar o registerUseCase no controller, ou nos testes, chamamos apenas essa factory e, se precisarmos alterar ou adicionar dependências, basta alterar a factory e todo o resto acompanha. No controller:

```js
    export async function register(request: FastifyRequest, reply: FastifyReply) {
        const registerBodySchema = z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string().min(6)
        });

        const { name, email, password } = registerBodySchema.parse(request.body);

        try {
            const registerUseCase = makeRegisterUseCase(); // Aqui

            await registerUseCase.execute({ name, email, password });
        }...
        ...
        ...
    }
```

Vamos fazer também uma factory para o authenticate.