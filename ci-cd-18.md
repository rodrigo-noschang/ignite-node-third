# CI - Continuous Integration
Agora que nos aproximamos do momento de colocar a aplicação no ar, vamos configurar nosso ambiente de **CI**. São estratégias e rotinas que criamos para lidar com a integração contínua de códigos, ou seja, receber códigos na aplicação continuamente. Isso é importante principalmente em projetos onde temos várias pessoas contribuindo para ele, e precisamos executar esses novos códigos e validar se a integração deles não vai quebrar nossa aplicação. 

Para implementar essa rotina de verificações, podemos usar da própria ferramenta de CI do github, através do **Github Actions**, que vai ser facilmente adaptada ao nosso projeto por conta dos nossos testes unitários e e2e.

## Configurando Github Actions - Testes Unitários
Vamos criar a seguinte estrutura de pastas: `~/.github/workflows`. Dentro dessa pasta vamos criar um arquivo para cada **workflow** que quisermos executar. Por "workflow" podemos entender vários comando que devem ser executados quando um código novo for inserido no nosso repositório. Vamos criar nosso primeiro workflow que vai **executar os testes unitários**, portanto o nome do arquivo vai ser `run-unit-tests.yml`:

```yml
    # Parte 1
    name: Run Unit Tests

    on: [push]

    jobs:
    run-unit-tests:
        # Parte 2
        name: Run Unit Tests
        runs-on: ubuntu-latest

        steps:
            # Parte 3
            - uses: actions/checkout@v3

            - uses: actions/setup-node@v3
                with:
                node-version: 18
                cache: 'npm'

            # Parte 4
            - run: npm ci

            - run: npm run test
```
Vamos tentar descrever esse trem:

- **Parte 1**: Na parte 1 estamos descrevendo esse primeiro workflow, que vai se chamar `Run Unit Tests`, e ele vai ser executado sempre que houver um push para o nosso repositório, é o que definimos no **on**, e aparentemente podemos inserir qualquer ação possível do git, ou várias delas. Depois dele, também vamos descrever esse o que esse primeiro workflow vai fazer, lá dentro de **jobs**;

- **Parte 2**: A parte 2 vai dar um nome para uma das funções do workflow, e vai dizer que queremos que ela seja rodada em uma máquina que tenha a última versão disponível do Ubuntu, que é o que definimos em **runs-on**. 

- **Parte 3**: Depois que definimos o workflow, e o ambiente onde ele vai ser rodado, vamos começar a "construir" esse ambiente de modo que seja possível rodar nossos testes unitários. O primeiro comando **uses: actions/checkout@v3** é para que essa máquina ubuntu que definimos anteriormente baixe a nossa aplicação e depois, no comando **actions/setup-node@v3**, vamos instalar e configurar o Node nela. A versão instalada vai ser a 18 e também passamos o `npm` como cache para aprimorar o processo de instalação de pacotes (ACHO EU).

- **Parte 4**: Depois que nosso ambiente já está pronto, com o Node e nossa aplicação baixados/instalados, vamos rodar o **npm ci**, para que sejam instaladas todas as nossas dependências. O comando **ci** tem o propósito de apenas instalar as dependências, sem fazer perguntas durante o processo, pedir confirmações, nem alterar nenhum tipo de arquivo, que não seja o node_modules. Feita as instalações, rodamos o comando que executa os testes unitários. 

Assim que subirmos esse novo arquivo para o github, é possível ver lá na dashboard do nosso repositório, na aba **Actions**, que esse procedimento é executado sempre que o repositório recebe um novo push.

Os comandos de instalação de aplicação e Node foram tirados do **github actions marketplace**, onde podemos buscar actions já pré definidas por outros usuários/empresas. Essas ações, especificamente, foram retiradas da Action **Setup Node.js environment**, disponível [aqui](https://github.com/marketplace?type=actions)

## Configurando Github Actions - Testes E2E
Assim como definimos uma action para os testes unitários, vamos definir uma para os nossos testes end-to-end também. Porém, como esses testes são mais lentos e exigem que toda a infraestrutura do projeto esteja criada e operante (bancos de dados, principalmente), não vamos executá-los em todos os pushs que são feitos para o nosso repositórios, como fizemos com os testes unitários. Nesse caso, é mais interessante executá-los apenas quando houver um **pull request**. 

Vamos criar esse workflow no arquivo `run-e2e-tests.yml`:

```yml
name: Run E2E Tests

on: [pull_request] # diff

jobs:
  run-e2e-tests:
    name: Run E2E Tests
    runs-on: ubuntu-latest

    services: # big diff start
      postgres:
        image: bitnami/postgresql
        ports:
          - 5432:5432
        env:
          POSTGRESQL_USERNAME: docker
          POSTGRESQL_PASSWORD: docker
          POSTGRESQL_DATABASE: ignite-gympass # big diff end

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          version: 18
          cache: 'npm'

      - run: npm ci

      - run: npm run test:e2e # diff
        env:
          JWT_SECRET: testing-jwt-secret
          DATABASE_URL: "postgresql://docker:docker@localhost:5432/ignite-gympass?schema=public"
```

Aqui a coisa já mudou um pouco de figura: Se ignorarmos a parte do **service** desse arquivo, todo o resto desse workflow é bastante parecido com o dos testes unitários. Algumas diferenças facilmente notáveis são:

- **on**: Agora esse nosso workflow só vai rodar quando houver um pull request, não mais quando houver um push;
- **run: npm run test:e2e**: Obviamente esse comando mudaria porque agora queremos rodar os testes e2e, e não mais os testes unitários. Mas além disso, nossos testes e2e, por fazerem uso de outros recursos da aplicação, como banco de dados e autenticação de usuários, precisamos informar para eles as variáveis de ambiente que elas vão precisar usar.  

    Nessas variáveis de ambiente, passamos um segredo aleatório para a geração do jwt, e também precisamos passar a url de um banco de dados. Como nosso banco de dados está sendo criado via docker, também precisamos replicar a criação desse serviço docker aqui nesse workflow. É importante reparar que o jeito de informar variáveis de ambiente aqui nos workflows é diferente do jeito do docker-compose. 

Feitas essas alterações, podemos agora simular um pull request ao criar uma outra branch, subi-la para o nosso repositório e criar um pull request, isso já vai ser o suficiente para rodar os os testes e2e, além, claro dos unitários.

# CD - Continuous Deploy/Delivery
Já o **CD** é o processo de realizar o deploy do projeto sempre que uma nova pull request for aceita, por exemplo. 

Essas duas coisas (ci/cd) podem ou não serem usadas juntas. 