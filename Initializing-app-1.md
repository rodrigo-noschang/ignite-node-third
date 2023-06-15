# Inicializando o app
Primeiro vamos criar nosso app Node, usando o `npm init -y` e vamos instalar o typescript, as tipagens do Node, o "compilador"/executor do ts, além do **tsup**, que é a ferramenta que gera nossa versão de build do app.

```sh
    $ npm i typescript @types/node tsx tsup -D
```

Vamos inicializar o nosso typescript usando o `npx tsc --init`, e trocar, dentro do arquivo `tsconfig.json`, a nossa propriedade **target** para "es2020".

E também vamos usar o fastify, de novo, para a criação do app e do server `npm i fastify`. 

Depois disso vamos criar nosso app (instância do fastify), e nosso server (o servidor que será subido), dessa forma separada por conta dos testes que serão implementados posteriormente.

E agora vamos criar os scripts de execução no `package.json`:

```json
    "scripts": {
        "dev": "tsx watch src/server.ts",
        "build": "tsup src --out-dir build",
        "start": "node build/server.js"
    }
```

Essas são as configurações básicas de um projeto Node com typescript e Fastify.

## Configurando o NPM
Para configurar o NPM podemos criar um arquivo `.npmrc` e nele podemos definir que as versões das nossas dependências sejam salvas exatamente naquela versão instalada, por exemplo, versão 18.14.0, e não ^18.14.0, permitindo que seja instalada a versão 18.14.0 ou superior. 

Isso é feito porque conforme o tempo passa, precisamos constantemente atualizar as dependências em produção e, tendo a versão exata da atualização, podemos utilizar um bot do github, como o **renovate**, que vai ficar tentando atualizar essas dependências. Ele baixa nosso projeto, tenta subir a versão, e roda os testes da aplicação para ver se a aplicação continua funcionando. Se nenhum teste for quebrado, ele cria um pull request com essa nova versão da dependência. É basicamente uma forma automatizada de atualizar as dependências. 

Essa prática é interessante de ser feita em aplicações de qualquer stack. No nosso arquivo `.npmrc`:

```
    save-exact=true
```

Depois disso, todas as novas bibliotecas que instalarmos virão com a versão fixada, e para fixar as versões das libs já instaladas, precisamos instalá-las novamente. 

## Variáveis de Ambiente
Também já vamos criar os arquivos .env e .env.example e já começar o uso e validação das nossas variáveis de ambiente usando o `dotenv` e o `zod`. 

## ESLint
Podemos também utilizar o ESLint para definir algumas regras de formatação que nosso código deve seguir. Vamos primeiro instalar ele e depois inciá-lo para definir essas configurações:

```sh
    $ npm i -D eslint

    $ npx eslint --init
```

## Atalhos de importação:
Vamos criar os aliases de importação para facilitar o processo de importar pacotes. Para realizar isso vamos no nosso arquivo `tsconfig.json` e vamos descomentar as chaves de **baseURL** e **paths**. Dentro da objeto presente em paths vamos fazer o seguinte

```json
    "paths": {
        "@/*": ["./src/*"]
    }
```

Isso basicamente diz que sempre que uma url de import começar com o "@/", eu quero que o VsCode entenda como se fosse um import vindo de "./src/", isso vai nos economizar vários "../../../" para termos que voltar lá no src e aí então entrarmos na pasta que queremos.