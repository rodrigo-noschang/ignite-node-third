# Escrevendo os Testes E2E
Depois de todas essas configurações, vamos finalmente escrever os testes E2E. Como fizemos antes no Knex, agora precisamos subir nosso servidor e testar tudo isso via requisições http e, novamente, quem vai fazer isso pra gente é o **supertest**:

```sh
    npm i -D supertest @types/supertest
```