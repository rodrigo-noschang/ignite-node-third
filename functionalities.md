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

## Comparando datas no Prisma
Quando implementamos o repositório em memória do checkin, usamos a seguinte lógica para verificar se já existia um checkin feito naquele dia, usando o `dayjs`:

```js
    const startOfDay = dayjs(date).startOf('date');
    const endOfDay = dayjs(date).endOf('date');

    const checkInOnSameDateBySameUser = this.items.find(item => {
        const checkInDate = dayjs(item.created_at);
        const isOnSameDate = checkInDate.isAfter(startOfDay) && checkInDate.isBefore(endOfDay);

        return item.user_id === userId && isOnSameDate
    });
```

Agora on prisma podemos usar uma funcionalidade específica dele:

```js
    async findUserByIdOnSpecificDate(userId: string, date: Date) {
        const startOfDay = dayjs(date).startOf('date');
        const endOfDay = dayjs(date).endOf('date');

        const checkIn = await prisma.checkIn.findFirst({
            where: {
                user_id: userId,
                created_at: {
                    gte: startOfDay.toDate(),
                    lte: endOfDay.toDate()
                }
            }
        })

        return checkIn;
    }
```

Podemos usar o **gte** (greater than ou equal, maior ou igual) e o **lte** (lower than or equal, menor ou igual).