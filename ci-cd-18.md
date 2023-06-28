# CI - Continuous Integration
Agora que nos aproximamos do momento de colocar a aplicação no ar, vamos configurar nosso ambiente de **CI**. São estratégias e rotinas que criamos para lidar com a integração contínua de códigos, ou seja, receber códigos na aplicação continuamente. Isso é importante principalmente em projetos onde temos várias pessoas contribuindo para ele, e precisamos executar esses novos códigos e validar se a integração deles não vai quebrar nossa aplicação. 

Para implementar essa rotina de verificações, podemos usar da própria ferramenta de CI do github, através do **Github Actions**, que vai ser facilmente adaptada ao nosso projeto por conta dos nossos testes unitários e e2e.

## Configurando Github Actions
Vamos criar a seguinte estrutura de pastas: `~/.github/workflows`. Dentro dessa pasta vamos criar um arquivo para cada **workflow** que quisermos executar. Por "workflow" podemos entender vários comando que devem ser executados quando um código novo for inserido no nosso repositório. Vamos criar nosso primeiro workflow que vai **executar os testes unitários**, portanto o nome do arquivo vai ser `run-unit-tests.yml`:

```yml
    name: Run Unit Tests

    on: [push]

    jobs:
    run-unit-tests:
        name: Run Unit Tests
        runs-on: ubuntu-latest

        steps:
        - uses: action/checkout@v3

        - uses: actions/setup-node@v3
            with:
            node-version: 18
            cache: 'npm'

        - run: npm ci

        - run: npm run test
```

# CD - Continuous Deploy/Delivery
Já o **CD** é o processo de realizar o deploy do projeto sempre que uma nova pull request for aceita, por exemplo. 

Essas duas coisas (ci/cd) podem ou não serem usadas juntas. 