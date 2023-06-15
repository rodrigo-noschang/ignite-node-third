# Prisma
O prisma é um ORM, os ORMs se diferenciam do Query Builders pela linguagem ainda mais abstrata e também por ter uma noção maior do formato do nosso banco de dados. Ele sabe (e se preocupa com) as tabelas que temos, as colunas e suas características e regras. 

```sh
    $ npm i prisma -D
```

Esse prisma que estamos instalando é apenas a CLI do prisma, e em seguida vamos inicializá-lo:

```sh
    $ npx prisma init
```

A partir disso vamos modelar nossa tabela de banco de dados dentro do arquivo `prisma/schema.prisma` que foi gerado pelo comando acima. Vamos criar uma model de exemplo:

```js
    model User {
        id    String @id @default(uuid())
        name  String
        email String @unique

        @@map("users")
    }
```

Aqui estamos definindo um modelo de entidade chamada User, que vai se transformar em uma tabela no nosso banco de dados, e essa tabela terá o nome **users**, conforme definimos no método `@@map`. Além disso, estamos definindo 3 colunas para ele:

- **id**: que será uma string, será uma chave primária (`@id`) e será, por padrão do, um uuid gerado pelo banco de dados;

- **name**: que será uma string; 

- **email**: que também será uma string e deverão ser valores únicos. 

Feita essa modelagem, podemos rodar o seguinte comando para pedir para o prisma criar, de forma automatizada, a tipagem dessas tabelas, ou seja, para poder integrá-la ao typescript e também os métodos que podemos fazer com essa entidade daqui pra frente.

```sh
    $ npx prisma generate
```

Para podermos criar nosso banco de dados, migrations, executar queries, agora precisamos instalar o client do Prisma

```sh
    $ npm i @prisma/client
```

Feito isso, em teoria, já podemos realizar algumas queries, que nesse momento não farão nada pois ainda não configuramos o banco em si.