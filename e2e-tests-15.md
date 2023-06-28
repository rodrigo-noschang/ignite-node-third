# Escrevendo os Testes E2E
Depois de todas essas configurações, vamos finalmente escrever os testes E2E. Como fizemos antes no Knex, agora precisamos subir nosso servidor e testar tudo isso via requisições http e, novamente, quem vai fazer isso pra gente é o **supertest**:

```sh
    npm i -D supertest @types/supertest
```

E como antes, vamos esperar o app ficar pronto, antes de rodar todos os testes, e ao final de todos, vamos fechá-lo:

```js
    import { app } from "@/app";
    import request from 'supertest';
    import { describe, it, expect, beforeAll, afterAll } from "vitest";

    describe('Register Controller (e2e)', () => {
        beforeAll(async () => {
            await app.ready()
        });

        afterAll(async () => {
            await app.close()
        });

        it('should be able to register', async () => {
            const response = await request(app.server)
                .post('/users')
                .send({
                    name: 'John Doe',
                    email: 'johndoe@mail.com',
                    password: '123456'
                })

            expect(response.statusCode).toEqual(201);
        })
    })
```

Lembrando que como os testes e2e são mais pesados e lentos, geralmente fazemos os testes apenas para o caso dos sucessos. Não vamos testar absolutamente tudo que pode acontecer em todas as ocasiões, porque isso já está sendo verificado nos testes unitários.

## Úteis para os testes
Na grande maioria das nossas requisições, os testes vão exigir que o usuário esteja logado, para não ter que sempre repetir o processo de criar usuário, logar ele e só então pegar o token em todos os testes, vamos criar uma função separada que faz isso pra gente, lá no `src/utils/tests`:

```js
    import request from 'supertest';
    import { FastifyInstance } from 'fastify';

    export async function createAndAuthenticateUser(app: FastifyInstance) {
        await request(app.server)
            .post('/users')
            .send({
                name: 'John Doe',
                email: 'johndoe@mail.com',
                password: '123456'
            });

        const response = await request(app.server)
            .post('/sessions')
            .send({
                email: 'johndoe@mail.com',
                password: '123456'
            });

        const { token } = response.body;

        return { token };
    }
```

Agora podemos substituir esse processo onde quer que ele seja necessário, como no próprio `users/profile.spec.ts`:

```js
    it('should be able to get own profile', async () => {
        const { token } = await createAndAuthenticateUser(app);

        const profileResponse = await request(app.server)
            .get('/me')
            .set('Authorization', `Bearer ${token}`);

        expect(profileResponse.statusCode).toEqual(200);
        expect(profileResponse.body.user).toEqual(
            expect.objectContaining({
                email: 'johndoe@mail.com'
            })
        );
    })
```

## Passando query para os testes
Em algumas rotas, como a de search gyms, estaremos passando o parâmetro da busca na url através das **querys**. Existem duas formas de mandar essas queries no supertest: ou passamos ela exatamente como as usamos na requisição, ou seja, direto na url (gyms/search`?q=Javascript`):

```js
    const response = await request(app.server)
            .get('/gyms/search?q=Javascript')
            .set('Authorization', `Bearer ${token}`)
            .send();
```

Ou, podemos passar de um jeito ainda mais organizado, como uma nova "especificação" dessa requisição, no método **.query**:

```js
    const response = await request(app.server)
        .get('/gyms/search')
        .query({
            q: 'Javascript'
        })
        .set('Authorization', `Bearer ${token}`)
        .send();
```