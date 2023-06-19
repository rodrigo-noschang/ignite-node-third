# Testes
Em um cenário real de desenvolvimento, é ideal sempre começarmos pela implementação dos testes para garantir que as regras de negócio estão sendo verificadas. Novamente, vamos usar o vitest para isso e, junto com ele, vamos instalar um plugin que o permita entender a estrutura de paths que criamos antes

```js
    $ npm i vitest vite-tsconfig-paths -D
```

E vamos configurar esse plugin no arquivo `vite.config.ts`:

```js
    import { defineConfig } from 'vitest/config';
    import tsconfigPaths from 'vite-tsconfig-paths';

    export default defineConfig({
        plugins: [tsconfigPaths()]
    })
```

E vamos criar dois scripts, um para rodar o vitest e parar, usando o `run`, e outro para ficar em modo de watch, que vai sempre reexecutar os testes quando o arquivo for alterado:

```json
    {
        "test": "vitest run",
        "test:watch": "vitest"
    }
```

## Teste Unitário do Primeiro caso de uso (Register)
As regras de negócio sempre vão nos sugerir coisas que devem ser testadas na aplicação, por isso é bom ter elas bem descritas e bem definidas. A ideia dos testes unitários também, além de testar uma unidade específica da nossa aplicação, é que esses testes sejam executados de forma completamente isolada das nossas dependências, como o prisma. 

Os testes unitários geralmente testam apenas um único arquivo sem invocar sua relação com outros arquivos/camadas ou como quiser chamar. A partir do momento em que estamos usando banco de dados, outras APIs, etc isso já passa a ser um teste de integração pois, obviamente, as camadas estão atuando de forma integrada. Para resolver isso, poderemos nos aproveitar da **inversão de dependências** que implementamos no caso de usos e fornecer, para o use-case, um repositório "nada a ver" (`src/use-cases/register.spec.ts`):

```js
    describe('Register Use Case', () => {
        it('should hash password upon registration', async () => {
            // Repositório nada a ver
            // Parte 1
            class MockedRepository implements UsersRepository {
                async findByEmail(email: string) {
                    return null
                }

                async create(data: Prisma.UserCreateInput) {
                    return {
                        id: 'user-1',
                        name: data.name,
                        email: data.email,
                        password_hash: data.password_hash,
                        created_at: new Date()
                    }
                }
            }

            // Parte 2
            const mockedRepository = new MockedRepository()
            const registerUseCase = new RegisterUseCase(mockedRepository);

            const { user } = await registerUseCase.execute({
                name: 'John Doe',
                email: 'johndoe@mail.com',
                password: '123456'
            })

            // Parte 3
            const isPasswordCorrectlyHashed = await compare('123456', user.password_hash);

            expect(isPasswordCorrectlyHashed).toBe(true);
        })
    })
```

Vamos dividir esse processo em 3 partes, marcadas nos comentários: 

- **Parte 1**: Primeiro estamos criando um repositório fake, que não faz uso de banco de dados, nem armazena nada em memória, a única coisa que ele faz é retornar um objeto com base nos dados que são recebidos e alterados pelo use-case. 

- **Parte 2**: Criamos uma instância desse repositório mockado e passamos para o use-case, assim como fazemos com o repositório do Prisma no nosso `controller` Depois de criado, executamos o método do use case passando um usuário de exemplo para sua criação.

- **Parte 3**: Por último, usamos o método **compare** do próprio bcrypt para ver se a senha informadas no login e a senha gerada pelo use-case são compatíveis através de seu hash. E claro, esperamos no teste que isso seja verdadeiro.

## In Memory Database
Para facilitar e agilizar os processos de teste, vamos usar o patter **in memory database** para armazenar os dados que serão testados. Porém, seguindo nossa lógica de desacoplamento e inversão de dependência, vamos implementar isso tudo em um novo repositório, que dessa vez faz acesso a variáveis estáticas, como um array:

```js
    export class InMemoryUsersRepository implements UsersRepository {
        public items: User[] = [];

        async findByEmail(email: string) {
            const user = this.items.find(item => item.email === email);
            if (!user) {
                return null;
            }

            return user;
        }

        async create(data: Prisma.UserCreateInput) {
            return {
                id: 'user-1',
                name: data.name,
                email: data.email,
                password_hash: data.password_hash,
                created_at: new Date()
            }
        }
    }
```

O método é exatamente o que tínhamos definidos nos próprios testes anteriormente, mas isolados em um repositórios. Agora, nossos testes, podemos eliminar toda a **Parte 1** e, na parte 2, ao invés de criar uma instância do repositório mockado, vamos utilizar o repositório dos users em memória que acabamos de implementar.

Agora vamos implementar o teste de email duplicado:

```js
    it('should not be able to register the same email twice', async () => {
        const inMemoryRepository = new InMemoryUsersRepository()
        const registerUseCase = new RegisterUseCase(inMemoryRepository);

        const email = 'johndoe@mail.com'

        await registerUseCase.execute({
            name: 'John Doe',
            email,
            password: '123456'
        })

        await expect(() => {
            registerUseCase.execute({
                name: 'John Doe',
                email,
                password: '123456'
            })
        }).rejects.toBeInstanceOf(UserAlreadyExistsError);
    })
```

A lógica aqui é exatamente a mesma, o que é novo é a forma de testar se um **erro** está sendo gerado em uma ação que retorna uma Promise (uma ação assíncrona). Executamos a ação sem o await (precisamos pegar a promise e sua rejeição ou sucesso), esperamos que ela seja rejeitada com um erro do tipo **UserAlreadyExistsError**. 

## Tests Coverage
É interessante sempre saber se estamos testando tudo que precisamos testar na nossa aplicação, para isso podemos usar ferramentas de coverage. Vamos criar um script para ele e ver o que acontece:

```json
    {
        "test:coverage": "vitest run --coverage"
    }
```

Esse comando vai nos gerar um arquivo, na raiz do projeto, chamado `coverage`, dentro dessa pasta, temos um arquivo `index.html` que nos traz uma representação de quais arquivos estão sendo usados nos testes e, desses arquivos, quantas linhas estão sendo testadas, quantas vezes estão sendo executadas, etc. 

É importante ressaltar que não é necessário que todos os arquivos tenham 100% de cobertura de testes, essa ferramenta só vai nos ajudar destacando quais partes do código eventualmente estarão sem testes e fica a nosso critério dizer se essas partes merecem ou não um teste para elas. 

## Vitest UI:
Também existe essa ferramenta que traz os testes de uma forma bem mais agradável de se ver, mas nenhuma informação FUNDAMENTAL a mais. Basta instalar ela:

```sh
    $ npm i -D @vitest/ui
```

E também criar um script pra ela:

```json
    { 
        "test:ui": "vitest--ui"
    }
```