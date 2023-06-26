# Buscando Academia Próximas
Essa caso de uso vai ser interessante porque envolve aplicar um cálculo um tanto quanto extenso para descobrir se as academias estão perto do usuário. Pensando em desempenho, não seria interessante listar todas as academias e realizar o cálculo nelas uma por uma, individualmente. Porém, nossos testes ainda estão sendo feitos em memória, as coisa vai ser mais simples, por enquanto. Vamos apenas realizar o calculo individualmente mesmo =(.

## Realizando busca de academias próximas no banco de dados
Não existe uma forma pronta e direta no prisma para realizar essa busca, ou realizar algum cálculo nos registros de alguma(s) tabela(s). O propósito de ferramentas como o prisma é justamente simplificar o acesso corriqueiro ao banco de dados, ao traduzir as queries mais simples que usamos com maior frequência, como é o caso das criações, buscas por ID, edição de algum registro, e assim por diante. 

Quando falamos de buscas mais complexas, ou que precisam de melhor performance, como é o caso dessa verificação de distâncias entre o usuário e as academias, vamos "apelar" para as **RAW QUERIES** em SQL puro, utilizando o **$queryRaw**. 

```js
    async findManyNearby({ userLatitude, userLongitude }: FindManyNearbyRequest) {
        const gyms = await prisma.$queryRaw<Gym[]>`
            SELECT * from gyms
            WHERE ( 6371 * acos( cos( radians(${userLatitude}) ) * cos( radians( userLatitude ) ) * cos( radians( userLongitude ) - radians(${userLongitude}) ) + sin( radians(${userLatitude}) ) * sin( radians( userLatitude ) ) ) ) <= 10
        `

        return gyms;
    }
```