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

## Relacionamentos com Prisma
Agora vamos criar as outras entidades que teremos na nossa aplicação, que são os **Checkins** e as **Gyms**. Na nossa aplicação, vamos começar estabelecendo uma relação 1:N entre os users e o checkins, ou seja, um user pode ter vários checkins. Para fazer isso, a extensão do prisma no VsCode nos ajuda bastante:

Dentro da model do CheckIn, basta "definirmos uma coluna" chamada **user**, e colocar como tipo dela a nossa model **User**. Simplesmente digitando isso e salvando, como temos definido o prisma formatOnSave nas nossas configurações, o próprio prisma já vai estabelecer essa relação pra gente, gerando a seguinte relação:

```
    model User {
        id            String   @id @default(uuid())
        name          String
        email         String   @unique
        password_hash String   @default("")
        created_at    DateTime @default(now())

        checkIns CheckIn[]

        @@map("users")
    }

    model CheckIn {
        id           String    @id @default(uuid())
        created_at   DateTime  @default(now())
        validated_at DateTime?

        user    User   @relation(fields: [user_id], references: [id])
        user_id String

        @@map("check_ins")
    }
```

Veja, na model do CheckIn, que temos nosso **campo** user, do tipo User e que tem uma relação com essa model User. E fica definido aqui também que essa relação se dará pela **coluna** `user_id`, e ela fará referência ao `id` da model User. Concomitantemente vemos que na model User foi criado um **campo** Checkin, que vai possuir vários (um array) elementos do tipo da model CheckIn.

Uma observação importante é a de que, no banco de dados de fato, somente serão criadas as colunas dos tipos primitivos do prisma (String, DateTime, Decimal, etc). Já os campos que definem relações com outras models não são transformados em colunas, esses servem apenas para referência do próprio prisma e para facilitar as relações no momento das queries. 

Portanto, tomando como exemplo a model Checkin, o campo user_id, por ser do tipo String, será transformado em uma coluna do nosso banco de dados, já o campo user, que é do tipo User (outra model do nosso banco), não será transformado em coluna, mas é essencial para que o prisma entenda as relações que queremos definir. 

O mesmo processo será feito para relacionar o checkin com as gyms, também 1:N. Depois de estabelecidas as relações, precisamos rodar as migrations **COM O CONTAINER RODANDO** para que o banco de dados as receba.

```sh
    $ npx prisma migrate dev
```

## Mostrando Logs no Prisma
Para mostrar alguns logs no Prisma, podemos definir isso no momento da criação da instância do PrismaClient, que agora está sendo feita no `src/lib/prisma.ts`:

```ts
    import { env } from "@/env";
    import { PrismaClient } from "@prisma/client";

    export const prisma = new PrismaClient({
        log: env.NODE_ENV === 'dev' ? ['query'] : []
    });
```

Nesse caso, estamos pedindo o log das queries apenas no ambiente de desenvolvimento. Nos demais ambientes, vamos deixar os logs padrão do prisma que são, basicamente, os logs de erro. 