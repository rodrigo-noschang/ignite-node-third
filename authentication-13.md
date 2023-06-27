# Autenticando usuário com JWT
Agora vamos começar a implementar os controllers da aplicação, para que ela seja acessível via requisições http. A primeira rota que vamos implementar é uma rota **GET em /me**, que vai retornar os dados pessoas do usuário então, como já se pode imaginar, ela só pode ser chamada por usuário logados/autenticados. 

## Estratégias de Autenticação
- **Basic Auth**: é a autenticação mais básica, em todas as requisições os usuário **precisa** enviar suas credencias (como usuário e senha) no cabeçalho das requisições, no formato Base64, que é uma representação desses dados de forma encriptada. Não é muito usado por não ser muito seguro ficar transitando dados sensíveis dos usuários, mesmo que encriptados, em todas as requisições. Até mesmo por isso, é recomendado que se use apenas em protocolos seguros e criptografados, como o próprio HTTPS.

- **JWT (JSON Web Token)**: Nessa estratégia, o usuário manda as credenciais na rota de login e o back-end devolve algumas informações para o usuário, como o seu **id** no banco de dados, inseridos em um Token codificado. Esse token possui 3 características principais:
    - **Stateless**: Não é armazenado em nenhuma estrutura de persistência de dados (banco de dados);

    - **Único**: Como esse token é stateless (não fica salvo em nenhum banco de dados), o back-end usa uma **palavra-chave** que vai ser inserida na codificação do token, e é através dela que conseguimos saber que esse token foi gerado por nós, e não é simplesmente um token aleatório gerado para tentar acessar a aplicação de forma maliciosa. Quanto mais aleatória for essa palavra, melhor. Também é enviado pelo cabeçalho da requisição nas rotas onde precisamos ser autenticados.

    - **Não modificável**; O token é composto por três partes, que são responsáveis pela sua codificação e são separadas por pontos (.): **cabeçalho**, que contém informações sobre o token em si e seu algoritmo de criptografia, **payload** (conteúdo que estamos enviando, como o id do usuário, essas informações são apenas codificadas e não criptografadas, por isso nunca mandaremos informações secretas por aqui), e **assinatura** (junta os dois valores anteriores, mais a palavra-chave, e é usado para a validação do token). Como o valor inserido no payload altera a assinatura, se algum usuário malicioso tentar alterar um valor la dentro, a assinatura já não será reconhecida.

    Como o próprio nome indica, o JSON **Web** Token é usado exclusivamente para chamadas http, ou seja, para acessos à aplicação feitos via web. Portanto, é importante notar que a implementação dele deve ser feita na camada que se refere a esse procedimento (http). Não faz sentido, portanto, deixar essa aplicação a cargo dos casos de uso, muito menos dos repositórios e sim da camada onde ele será utilizado, no caso, nos **controllers**.

## Implementando o JWT no fastify

```sh
    $ npm i @fastify/jwt
```

No nosso `app.ts`, vamos registrá-lo no nosso **app**:

```js
    import fastifyJwt from "@fastify/jwt";

    export const app = fastify();

    app.register(fastifyJwt, {
        secret: env.JWT_SECRET
    })
```

Nesse momento já aproveitamos para inserir a palavra chave que, obviamente, precisa ser um valor secreto, então deixaremos ela como uma variável de ambiente. Portanto, precisamos também atualizar o arquivo `.env.example` e claro o `src/env/index.ts` para incluir a verificação da existência dessa variável.

Uma vez registrado o **fastifyJwt**, temos acesso a alguns métodos a mais nas nossas rotas, mais especificamente, dentro dos objetos **request** e **reply**. 

Vamos implementar a nossa criação do token e enviar ele para o nosso usuário quando ele realizar um login via https, ou seja, no `src/http/controller/authenticate.ts`. Antes não estávamos retornando nada para o usuário quando esse login era feito, agora vamos pegar o usuário que é retornado do caso de uso e vamos gerar um token a partir dele, abaixo apenas a parte do controller que faz isso:

```js
    try {
        const authenticateUseCase = makeAuthenticateUserCase();

        const { user } = await authenticateUseCase.execute({
            email,
            password
        });

        const token = await reply.jwtSign({}, {
            sign: {
                sub: user.id
            }
        });

        return reply.send({
            token
        })
    }
```

Como se pode ver, no primeiro parâmetro do **jwtSign**, deixamos um objeto vazio: esse objeto é o nosso payload, são as informações adicionais que podemos enviar de volta codificadas no token. Porém, a informação essencial do token geralmente é o id do usuário, que deve ser mandado naquela chave em específica do método **jwtSign**. Essa chave está dentro de `sign` (assinatura) e `sub` (subject, ou objeto ao qual esse token se refere).

## Recebendo e decodificando o JWT
Nas rotas que são privadas, ou seja, rotas em que o usuário só pode acessar se estiver logado/autenticado, precisamos receber o token do usuário através do header do request e então "decodificá-lo" para poder recuperar os valores que foram inseridos nele no momento da sua criação: no login. Um exemplo disso é a rota **GET em /me** que foi mencionada no começo do arquivo.

```js
    export async function profile(request: FastifyRequest, reply: FastifyReply) {
        await request.jwtVerify();

        console.log(request.user);

        return reply.send();
    }
```

Essa função **request.jwtVerify** faz duas coisas: (1) valida se o token existe no cabeçalho e se ele é valido e (2) coloca os dados inseridos nele dentro desse objeto **request.user**, mas precisamos indicar para o fastify/jwt quais são as chaves que existem lá, em um arquivo `src/@types/fastify.d.ts` (de acordo com a documentação):

```js
    import "@fastify/jwt"

    declare module "@fastify/jwt" {
        interface FastifyJWT {
            user: {
            sub: string
            }
        }
    }
```

## Middleware de verificação de JWT
Como teremos várias rotas privadas, faz sentido isolarmos esse processo de verificação e validação de JWT em um middleware e usá-lo nessas rotas:
`src/http/middleware/verify-jwt.ts`:

```js
    import { FastifyReply, FastifyRequest } from "fastify";

    export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();
        } catch (error) {
            return reply.status(401).send({
                message: 'Unauthorized'
            })
        }
    }
```

Agora, nas rotas que quisermos invocar esse middleware, fazemos (`src/http/routes.ts`):

```js
export async function appRoutes(app: FastifyInstance) {
    app.post('/users', register);
    app.post('/sessions', authenticate);

    app.get('/me', { onRequest: [verifyJWT] }, profile) // Aqui
}
```