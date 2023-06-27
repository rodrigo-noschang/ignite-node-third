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

## Proposta dos testes
Lembrando que como os testes e2e são mais pesados e lentos, geralmente fazemos os testes apenas para o caso dos sucessos. Não vamos testar absolutamente tudo que pode acontecer em todas as ocasiões, porque isso já está sendo verificado nos testes unitários.