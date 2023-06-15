# Funcionalidades Usadas no projeto
Aqui ficarão listadas algumas funcionalidades que não estão necessariamente relacionadas com o core do projeto, mas que são importantes e dignas de nota.

## Hash da senha do usuário
Como se sabe, não é bom salvar a senha de um usuário como texto normal no banco de dados, é importante sempre criptografá-la e salvar o formado encriptado. Para fazer essa criptografia (e descriptografia, na hora de efetuar o login), vamos usar o **bcrypt**:

```sh
    $ npm i bcryptjs
    $ npm i -D @types/bcryptjs
```

Utilizando ele:

```js
    import { hash } from "bcryptjs";

    const password_hash = await hash(password, 6);
```

Basicamente chamamos o método (que é assíncrono), e fornecemos a string base que queremos criptografar, no caso a senha do paciente, e também a quantidade de rounds. Essa quantidade vai dizer quantas vezes a nossa string vai passar pelo processo de criptografia:

```
        original         round 1                 round 2                                          round 6
senha = "123456" ---> "das2aa89s7f" ---> "djalfihl2r8192fhjefh" ---> ... ---> "aois74u98rhfDQWG_ASDG#Qefsadfoiu2h3%(!@#fasdf@#)"
```