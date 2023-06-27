# Vamos começar a fazer os testes E2E:
Como já dito antes, os testes E2E testam toda a aplicação do início ao fim e, por consequência, acaba fazendo uso do banco de dados. Neles, precisamos nos certificar de que não usaremos o mesmo banco em que rodamos a aplicação. Portanto, vamos criar um banco separado. Mas ainda tem um outro detalhe, além de ser um banco separado do ambiente de desenvolvimento, é necessário/recomendado que as modificações feitas em um teste, não influenciem, ou não apareçam em outros testes. Por exemplo, um usuário criado em um teste de criação de usuário não deve aparecer em um teste de listagem de usuários. 

Nos testes em memória resolvemos isso criando e recriando nossos repositórios e casos de uso antes de todos os testes, garantindo que aqueles dados em memória estariam zerados antes de cada teste. No caso dos testes E2E, onde se faz necessário o uso do banco de dados real, esse processo de "limpar" o ambiente de cada teste começa a ficar custoso e lento. É necessário, portanto, uma análise um pouco mais criteriosa a respeito de quais testes precisam, de fato, de um banco de dados absolutamente zerado. 

Aqui já é válido considerar a possibilidade de resetar o ambiente de banco de dados para cada suíte de testes, e não para cada teste em si. Por "suíte de testes" entendemos o arquivo todo de um teste, geralmente englobado pelo **describe**. Dessa forma pelo menos garantimos que os testes referentes a criação de academias, por exemplo, não interfira nos testes de criação de usuários. Ou ainda mais específico, os testes de criação de usuário, não vão interferir nos testes de autenticação, e assim por diante.

## Separação de Ambientes no Vitest
O Vitest fornece uma ferramenta para isso chamada **Test Environment**, onde podemos definir especificações de um ambiente, como variáveis de ambientes, scripts, etc, para diferentes arquivos/tipos de teste. Porém¹, isso ainda não pode ser feito dentro do projeto, é preciso criar um pacote **npm**, com o nome `vitest-environment-[nome-do-ambiente]`. Porém², é possível burlar isso "simulando" um pacote npm dentro da nossa aplicação. Vamos fazer isso em uma nova pasta criada em `prisma/vitest-environment-prisma`. Vamos agora navegar pra dentro dessa pasta e inicializar um novo projeto nela: 

```sh
    $ cd prisma/vitest-environment-prisma
    $ npm init -y
```
E já vamos também criar um novo arquivo aqui dentro `prisma-test-environment.ts`, e colocar esse mesmo cara como **main** do nosso novo arquivo `package.json` gerado pelo comando anterior. Esse arquivo deve estar:

```json
    {
        "name": "vitest-environment-prisma",
        "version": "1.0.0",   
        "description": "",
        "main": "prisma-test-environment.ts",
        "keywords": [],
        "author": "",
        "license": "ISC"
    }
```

Agora, dentro do nosso arquivo `prisma-test-environment.ts`, vamos definir esse nosso **Environment**:

```js
    import { Environment } from 'vitest';

    export default <Environment>{
        name: 'prisma',
        async setup() {
            console.log('Executou no início dos testes');

            return {
                teardown() {
                    console.log('Executou no final dos testes');
                }
            }
        }
    }
```

Aqui estamos simplesmente exportando um objeto com o nome do ambiente e um método **setup**. Esse método é o que será executado ANTES de cada **SUÍTE/ARQUIVO** de teste, não antes de cada teste. E o método **teardown**, que está dentro do objeto de retorno, é o que será executado DEPOIS de cada **SUÍTE/ARQUIVO** de teste. Os dois métodos são como um beforeAll ou afterAll. 

## Rodando testes no ambiente Vitest/Prisma
Antes de tudo, vamos criar um teste de exemplo dentro de `src/http/controllers/register.spec.ts`, apenas para ver como executá-lo.

```js
    import { test } from "vitest";

    test('ok', () => { });
```

Agora, vamos indicar para o vitest que sempre que ele for rodar um teste de dentro da pasta **http**, queremos que ele use o ambiente que foi definido acima, lá no `prisma/vitest-environment-prisma/prisma-test-environment`. Ou seja, estamos pedindo que, antes de executar os testes dentro de cada arquivo de teste presente na pasta http, ele rode o método **setup**, e depois de finalizados os testes, rode o método **teardown**. Fazemos essa configuração no arquivo `vite.config.ts` (especificamente na chave **test**):

```ts
    import { defineConfig } from 'vitest/config';
    import tsconfigPaths from 'vite-tsconfig-paths';

    export default defineConfig({
        plugins: [tsconfigPaths()],
        test: {
            environmentMatchGlobs: [
                ['src/http/controllers/**', 'prisma']
            ]
        }
    })
```

O que fazemos, basicamente, é indicar o caminho para esses arquivos de testes, no caso todos os testes presentes na pasta (e subpastas em) controllers, e também passamos o ambiente que ele deve usar. É importante notar que o nome desse ambiente, no caso `prisma`, precisa ser **exatamente** o nome que vem depois do `vitest-environment`, na pasta criada dentro da pasta **prisma**. Se essa pasta fosse chamada `vitest-environment-aipim`, o segundo elemento daquele array deveria ser `aipim`. 

Rodando os testes agora, obteremos um erro relacionado à url que fornecemos, pois o nosso projeto ainda não tem conhecimento de que esse **pacote npm** com o ambiente desse teste existe. O que precisamos fazer é **linkar** o package.json do nosso ambiente, com o package.json do nosso projeto:

## Linkando os pacotes
Essa parte é mágica e enganação pura, mas funciona. 

Primeiro vamos dentro da página do nosso pacote de ambiente, ou seja, `prisma/vitest-environment-prisma`, e rodar:
```sh
    $ npm link
```

Depois, vamos voltar pra raiz da aplicação e "instalar" esse pacote do ambiente, cujo nome é **vitest-environment-prisma** (de acordo com o nome da pasta, como o npm init -y faz por padrão). Na `raiz do projeto` rodamos:

```sh
    $ npm link vitest-environment-prisma
```

Agora, podemos rodar o **npm run test** normalmente, e o vitest vai reconhecer esse novo ambiente que, por meio de mágica e enganação, ele acha que é um outro pacote npm separado. Se você n tá maluco agora e completamente perdido, tem algo errado contigo. E claro, já podemos ver o log feito pelo método **setup**.

Lembrando que todos esses processos só garantem esse "link" na máquina em que foram executados, na máquina de um outro desenvolvedor, ou em ferramentas de automatização de testes/gerenciamento de dependências, isso precisa ser refeito. Para facilitar isso, vamos criar um script que realiza esse passo a passo **antes** de rodar o comando **test:e2e** (dá uma olhada no tópico seguinte "Separando scripts de testes"). 

No package.json, conseguimos definir isso automaticamente ao criar um novo script com o mesmo nome, no caso, **test:e2e**, e adicionar o prefixo **pre** ou **post**, para comandos que devem ser executados antes ou depois do script original, respectivamente. No caso, como queremos rodar alguns comandos ANTES do test:e2e, vamos criar o script **pretest:e2e**.

PORÉM, antes de implementar esse script, vamos fazer uso de uma lib chamada **npm-run-all**:

```sh
    $ npm i -D npm-run-all
```

O que ela faz é garantir que aquele script, que geralmente vai ser escrito voltado para um sistema Unix, seja traduzido para o sistema operacional que esteja sendo usado. Além disso, também nos permite definir a forma em que os comandos serão executados, de forma sequencial, usando o **npm run-s** ou de forma paralela, usando o **num run-p**. Agora, vamos criar os seguintes scripts:

```json
    "scripts": {
        "test:create-prisma-environment": "npm link ./prisma/vitest-environment-prisma",
        "test:install-prisma-environment": "npm link vitest-environment-prisma",
        "pretest:e2e": "run-s test:create-prisma-environment test:install-prisma-environment",
        "test:e2e": "vitest run --dir src/http"
    }
```

Criamos um script que "cria" aquele pacote npm, que vai ser o nosso ambiente prisma, e outro script que o instala na nossa aplicação original. Depois, definimos o script **pretest:e2e**, que vai só rodar esses 2 comandos, sempre que o test:e2e for executado. Isso vai deixar os testes um pouco mais lentos, mas vai garantir que não teremos problemas de compatibilidade entre máquinas e sistemas operacionais.

## Separando scripts de testes
Vamos separar os scripts de execução de testes para não ter que rodar os testes e2e toda vez que for rodar os testes unitários, essas duas categorias devem ser independentes. No `package.json`, vamos adicionar a flag **--dir** e direcionar onde estão os testes que queremos rodar:

```json
    "scripts": {
        "test": "vitest run --dir src/use-cases",
        "test:watch": "vitest --dir src/use-cases",
        "test:e2e": "vitest run --dir src/http",
    }
```

## Configurando o Objeto do Ambiente Prisma
Vamos trazer as funcionalidades que precisamos para o nosso objeto de ambiente que, por enquanto, está apenas fazendo aqueles console.logs de exemplo. O fato de estarmos usando PostgreSQL vai facilitar bastante nossa vida porque ele já traz embutido nele próprio a possibilidade de criar outros "contextos", isolados uns dos outros, dentro de um mesmo banco de dados. Fazemos isso criando novos **schemas** dentro do nosso mesmo banco de dados.

Por padrão, todos os bancos postgres possuem um schema principal, **public**, e nós podemos criar outros schemas que existirão em um "contexto" completamente isolado do public (ou de outros contextos que vierem a existir), sem compartilhar dados nem nada, perfeito para ser usado nos testes e2e. Faremos a criação desse schema justamente na função **setup** do nosso objeto de ambiente, e como não queremos ficar acumulando schemas desnecessariamente, na função **teardown**, iremos excluir todos esses schemas:

```js
    export default <Environment>{
        name: 'prisma',
        async setup() {
            // Parte 1
            const schema = randomUUID();
            const url = generateSchemaURL(schema);

            // Parte 2
            process.env.DATABASE_URL = url;
            execSync('npx prisma migrate deploy');

            return {
                async teardown() {
                    // Parte 3
                    const prisma = new PrismaClient();

                    await prisma.$executeRawUnsafe(
                        `DROP SCHEMA IF EXISTS "${schema}" CASCADE`
                    );

                    await prisma.$disconnect();
                }
            }
        }
    }
```

Vamos passo a passo nessa função:

**Parte 1**: Antes de tudo, conforme dito antes, vamos criar um novo "contexto" do nosso banco de dados, ao criar um novo schema dele. Para gerar um nome de schema seja aleatório e único, vamos fazer uso do **randomUUID**, e vamos enviar esse id para função que vai criar essa nova url do banco de dados, mas com esse id no lugar do schema. A função de criação de url segue:

```js
    function generateSchemaURL(schema: string) {
        const databaseUrl = process.env.DATABASE_URL
        if (!databaseUrl) throw new Error('Inform a DATABASE_URL on environment variables');

        const url = new URL(databaseUrl);
        url.searchParams.set('schema', schema);

        return url.toString();
    }
```

Nessa função verificamo se a url do banco de dados existe e geramos um erro caso não exista. Se existir, vamos gerar uma nova instância URL (classe global do Node) que vai nos dar, na variável **url**, um objeto que tenha de forma separada todos os valores da url do banco de dados, como o protocolo, o host, usuário, senha, etc. Cada um desses será uma chave no objeto url.

No caso de urls Postgres, o Node entende a parte do schema como uma searchParams (faz sentido, já que vem após um "?" na url), e vamos definir esse valor como sendo aquele id aleatório que geramos anteriormente. Definido isso, voltamos a url para o formato de string original de uma url Postgres: `postgresql://docker:docker@localhost:5432/db-name?schema=[id-aleatorio]`

**Parte 2**: Na parte 2, vamos sobrescrever a variável de ambiente DATABASE_URL, e rodar as migrations do prisma para que esse novo schema tenha exatamente o mesmo formato e regras do nosso banco de desenvolvimento. Perceba que agora o migrate do prisma está sendo feito usando o **deploy**, que é uma forma de garantir que o prisma não vai procurar diferenças entre o schema atual e as migrations, e tentar gerar uma nova migration. Ele vai apenas executar as migrations já definidas por nós. 

**Parte 3**: A parte 3, finalmente, é onde deletamos os schemas que foram criados durante a execução dos testes, bastante simples e direto. 

Lembrando que todo esse processo é executado **PARA CADA SUÍTE/ARQUIVO DE TESTES**. Se tivermos n arquivos de testes, geraremos n schemas diferentes.