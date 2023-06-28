# Refresh Token
Precisamos encontrar alguma forma de "expirar" o token criado pelo usuário, no caso de um logout ou algo do tipo. Temos duas opções principais para isso, a primeira, e mais comum, é geralmente embutir nos valores do token a data de expiração. Nos tokens, por padrão, sempre conseguimos pegar a informação **iat** (issued at), que informa quando aquele token foi criado. A partir disso, a aplicação pode deixar de aceitar esse token depois de um algum tempo, alguns dias, horas, qualquer coisa. 

Outra opção é deixar o usuário logado para sempre, e aí precisamos usar a estratégia de **refresh token**. Nesse caso, além de gerar o token normal, que é transitado entre o back e o front end, também geramos um segundo token com tempo de expiração maior e que é usado especificamente para renovação do token original. Este segundo token fica criptografado e não é acessível pelo front end, e **pode** ser salvo no banco de dados. 

## Implementação
A primeira coisa que vamos fazer pra implementar o refresh token é, no nosso arquivo `app.ts` determinar um "prazo de validade" para o nosso token:

```js
    app.register(fastifyJwt, {
        secret: env.JWT_SECRET,
        sign: {
            expiresIn: '10m'
        }
    })
```

Aqui definimos que quando usuário tentar fazer uso do seu token 10 minutos após sua criação, o back-end vai entrar na rotina de "recriar o token", que é justamente procurar se existe um refresh token relacionado àquele usuário e então recriar o token original. 

Agora, no nosso `controller de autenticação`, vamos adicionar também a criação do nosso refresh token:

```js
    // Criação do token original, usado para autenticação
    const token = await reply.jwtSign({}, {
        sign: {
            sub: user.id
        }
    });

    // Criação nova do refreshToken
    const refreshToken = await reply.jwtSign({}, {
        sign: {
            sub: user.id,
            expiresIn: '7d'
        }
    })
```

Aqui estamos definindo um tempo de expiração muito maior, de 7 dias. A ideia é que o usuário só precise **refazer o login**, caso ele fique 7 dias sem entrar na aplicação, pois dessa forma, até o refresh token dele será expirado. Esse refresh token, como não queremos que o usuário tenha acesso diretamente a ele, será enviado para o front-end através de **cookies**. 

Para usar os cookies, vamos precisar instalar a "extensão" do fastify que trabalha com isso `npm i @fastify/cookie`. E registrá-lo no `app.ts`:

```js
    import fastifyCookie from "@fastify/cookie";

    app.register(fastifyCookie);
```

E agora, na resposta da rota do `controller/authenticate`, vamos inserir esse cara nos cookies, com algumas configurações:

```js
    return reply
        .setCookie('refreshToken', refreshToken, {
            path: '/',
            secure: true,
            sameSite: true,
            httpOnly: true
        })
        .status(200)
        .send({
            token
        })
```

O **path** indica quais rotas do nosso back-end terão acesso àquele item do cookie, colocando `/`, estamos permitindo que todas as rotas o acessem. O **secure** serve para indicarmos que queremos criptografar esse valor, por meio do https, impedindo o front-end de ler o **valor** (a própria string) do refresh token. 

O **sameSite**, indica que esse cookie só ficará salvo nesse único site, e o **httpOnly** diz que esse valor de cookie só existirá entre requisições http, ele não ficará salvo em lugar nenhum da resposta para o front-end. Não será possível acessá-lo, por exemplo, em um objeto como o `response.headers.cookie`, ou algo do tipo no front-end.

Ainda falta uma última configuração lá no nosso app:

```js
    app.register(fastifyJwt, {
        secret: env.JWT_SECRET,
        cookie: {
            cookieName: 'refreshToken',
            signed: false
        },
        sign: {
            expiresIn: '10m'
        }
    })
```

## Refresh do Token
Até agora o que fizemos foi, no momento do login do usuário, criar um segundo token e "enviá-lo" de volta ao front-end por meio de cookies. E claro configuramos toda a criptografia e segurança necessária para que o front não tenha acesso ao valor cru desse refresh token. Para implementar essa nova revalidação/recriação de um token, vamos criar um **controller** à parte:

```js
    import { FastifyReply, FastifyRequest } from "fastify";

    export async function refresh(request: FastifyRequest, reply: FastifyReply) {
        await request.jwtVerify({ onlyCookie: true });

        const token = await reply.jwtSign({},
            {
                sign: {
                    sub: request.user.sub
                }
            }
        );

        const refreshToken = await reply.jwtSign({},
            {
                sign: {
                    sub: request.user.sub,
                    expiresIn: '7d'
                }
            }
        )

        return reply.setCookie('refreshToken', refreshToken, {
            path: '/',
            secure: true,
            sameSite: true,
            httpOnly: true
        })
            .status(200)
            .send({ token });
    }
```

Nessa implementação, a lógica é basicamente validar o nosso token, mas dessa vez olhando para o token que está **nos cookies**, não para o token que é enviado via header. Se a função passar dali, quer dizer que aquele token é valido, e ainda não expirou, e então geramos um novo token e atualizamos também o refresh token. 

Caso o token dos cookies não seja válido, ou não exista, a função **jwtVerify** já vai gerar um erro. E claro, no nosso `users/routes.ts` precisamos também criar essa rota:

```js
    export async function usersRoutes(app: FastifyInstance) {
        ...
        ...
        
        app.patch('/token/refresh', refresh);
    }
```