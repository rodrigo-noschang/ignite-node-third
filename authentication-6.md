# Caso de uso para Autenticação
Sempre que vamos implementar uma nova funcionalidade, é interessante começar pelo caso de uso, que já nos permite realizar os testes em cima dessa aplicação e só então realizar as conexões com as dependências e meio externos. Vamos implementar esse caso de uso no `src/use-cases/authenticate.ts`

```js
    import { User } from "@prisma/client";

    import { UsersRepository } from "@/repositories/users-repository";
    import { InvalidCredentialsError } from "./errors/invalid-credentials-error";
    import { compare } from "bcryptjs";

    interface AuthenticateUseCaseRequest {
        email: string,
        password: string
    }

    interface AuthenticateUseCaseReply {
        user: User
    }

    export class AuthenticateUseCase {
        constructor(private usersRepository: UsersRepository) { }

        async execute({ email, password }: AuthenticateUseCaseRequest): Promise<AuthenticateUseCaseReply> {
            const user = await this.usersRepository.findByEmail(email);

            if (!user) {
                throw new InvalidCredentialsError();
            }

            const doPasswordsMatch = await compare(password, user.password_hash);

            if (!doPasswordsMatch) {
                throw new InvalidCredentialsError();
            }

            return {
                user
            }
        }
    }
```

Basicamente é a mesma ideia: recebemos um repositório no constructor da classe, e no execute buscamos o usuário pelo email e depois, caso ele exista, comparamos a senha informada com a senha criptografada no banco. Se em algum desses dois momentos algo der errado, lançamos um erro de credenciais inválidas. Se tudo der certo, retornamos o usuário.

E também implementamos esse novo erro no `src/use-cases/errors/invalid-credentials-error.ts`:

```js
    export class InvalidCredentialsError extends Error {
        constructor() {
            super('Invalid credentials');
        }
    }
```

Bem direto e rápido. Vamos agora implementar os testes desse use-case, antes mesmo de executá-la através do sistema para ver se algo deu errado. Tendo o repositório **em memória** dos usuário, já conseguimos realizar os testes, veja o arquivo `src/use-cases/authenticate.spec.ts`. Nesse arquivo estamos mudando o nome da instância do use case para **sut** (System Under Test). Isso é feito tanto para identificar melhor o que é que está sendo testado e também evita erros de nomenclatura de variável caso queiramos simplesmente copiar e colar a estrutura de um teste no outro para reaproveitá-la.

Uma vez que os testes estejam passando, podemos passar para a parte de conectá-lo com as chamadas http, criando um controller pra ele, veja o arquivo `src/http/controllers/authenticate.ts`.