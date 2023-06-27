# Vamos começar a fazer os testes E2E:
Como já dito antes, os testes E2E testam toda a aplicação do início ao fim e, por consequência, acaba fazendo uso do banco de dados. Neles, precisamos nos certificar de que não usaremos o mesmo banco em que rodamos a aplicação. Portanto, vamos criar um banco separado. Mas ainda tem um outro detalhe, além de ser um banco separado do ambiente de desenvolvimento, é necessário/recomendado que as modificações feitas em um teste, não influenciem, ou não apareçam em outros testes. Por exemplo, um usuário criado em um teste de criação de usuário não deve aparecer em um teste de listagem de usuários. 

Nos testes em memória resolvemos isso criando e recriando nossos repositórios e casos de uso antes de todos os testes, garantindo que aqueles dados em memória estariam zerados antes de cada teste. No caso dos testes E2E, onde se faz necessário o uso do banco de dados real, esse processo de "limpar" o ambiente de cada teste começa a ficar custoso e lento. É necessário, portanto, uma análise um pouco mais criteriosa a respeito de quais testes precisam, de fato, de um banco de dados absolutamente zerado. 

Aqui já é válido considerar a possibilidade de resetar o ambiente de banco de dados para cada suíte de testes, e não para cada teste em si. Por "suíte de testes" entendemos o arquivo todo de um teste, geralmente englobado pelo **describe**. Dessa forma pelo menos garantimos que os testes referentes a criação de academias, por exemplo, não interfira nos testes de criação de usuários. Ou ainda mais específico, os testes de criação de usuário, não vão interferir nos testes de autenticação, e assim por diante.

## Separação de Ambientes no Vitest
O Vitest fornece uma ferramenta para isso chamada **Test Environment**, onde podemos definir especificações de um ambiente, como variáveis de ambientes, scripts, etc, para diferentes arquivos/tipos de teste. Porém¹, isso ainda não pode ser feito dentro do projeto, é preciso criar um pacote **npm**, com o nome `vitest-environment-[nome-específico]`. Porém², é possível burlar isso "simulando" um pacote npm dentro da nossa aplicação. Vamos fazer isso em uma nova pasta criada em `prisma/vitest-environment-prisma`. Vamos agora navegar pra dentro dessa pasta e inicializar um novo projeto nela: 

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