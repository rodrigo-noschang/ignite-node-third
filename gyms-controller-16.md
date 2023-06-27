# Controllers para as academias
Antes de começar, reestruturamos nossos controllers criando uma pasta para cada entidade users, gyms e posteriormente, provavelmente, checkins. E também vamos criar um routes para cada pasta dessas. 

As funcionalidades das academias, por exemplo, todas exigem que o usuário esteja logado, portanto faz sentido criar uma rota específica pra ela e aplicar o **verifyJWT**, que foi criado anteriormente, como **hook** para todos os elementos dessa rota, dessa forma não precisamos inseri-los manualmente, como fizemos com a rota GET /me, para pegar os dados do usuário. No `src/http/controllers/gyms/routes.ts`:

```js
    import { FastifyInstance } from "fastify";

    import { verifyJWT } from "@/http/middlewares/verify-jwt";

    export async function gymsRoutes(app: FastifyInstance) {
        app.addHook('onRequest', verifyJWT);

    }
```
É importante lembrar-se de registrar essa rota também lá no `app.ts`.

## Controller para criação de academia
Aqui temos algumas observações interessantes:

```js
    import { z } from "zod";
    import { FastifyReply, FastifyRequest } from "fastify";

    import { makeCreateGymUseCase } from "@/use-cases/factories/make-create-gym-use-case";

    export async function create(request: FastifyRequest, reply: FastifyReply) {
        const createGymBodySchema = z.object({
            title: z.string(),
            description: z.string().nullable(),
            phone: z.string().nullable(),
            latitude: z.number().refine(value => {
                return Math.abs(value) <= 90;
            }),
            longitude: z.number().refine(value => {
                return Math.abs(value) <= 180
            })
        })

        const { title, description, phone, latitude, longitude } = createGymBodySchema.parse(request.body);

        const createGymUseCase = makeCreateGymUseCase();

        await createGymUseCase.execute({
            title,
            description,
            phone,
            latitude,
            longitude
        })

        return reply.status(201).send()
    }
```

Aqui usamos uma nova função do zod, o **refine**, comentado lá no `functionalities.md`, mas é bastante intuitivo o que tá rolando ali.

Também temos um caso interessante onde não estamos envolvendo nossa inserção no banco de dados em um try/catch. Como aqui não temos uma aplicação de regra de negócio, temos apenas validação de campos feitos (que é feita pelo zod), se algum erro for interceptado por ele, ele cairá no **app.errorHandler** definido no `app,ts`, dessa forma não temos necessidade de gerar um novo erro. 