# TDD - Test-Driven Design
Vamos dar uma pausa na implementação do caso de uso do checkin, para agora ter uma abordagem voltada aos testes. O **TDD** sugere um modelo de desenvolvimento voltado aos testes, ou seja, podemos começar implementando o básico de uma funcionalidade (como fizemos agora com o caso de uso dos checkins), e então já escrever os testes das suas regras de negócio. 

Quando estamos desenvolvendo dessa forma, passamos por algumas etapas:

- **Red**: Esse é o primeiro estágio de todos, onde absolutamente todos os testes que escrevemos irão falhar, já que a única coisa que temos implementada é o funcionamento básico de um checkin quando tudo dá certinho;

- **Green**: Esse próximo estado, como já se pode imaginar, é o estado onde os **todos os testes** começam a passar. Aqui, já implementamos o suficiente para satisfazer as regras de negócios que nossos testes se propõem a verificar. Só depois que essa etapa é concluída é que podemos passar para o próximo estágio;

- **Refactor**: Aqui começaremos a cuidar da forma do código, nomenclaturas, redundâncias, trechos que podem ser isolados em funções, assim por diante. 

É importante lembrar que os testes unitários sempre devem ser o mais específico possível, é melhor termos vários testes que testam pequenas coisas, do que poucos testes que se propõem a testar várias partes da aplicação de uma só vez. 

Vamos implementar um segundo teste que vai verificar se a regra de negócio **não é possível fazer 2 check-ins no mesmo dia** está sendo cumprida:

```js
    it('should not be able to check in twice in the same day', async () => {
        await sut.execute({
            userId: 'user-01',
            gymId: 'gym-01'
        })

        await expect(() => {
            return sut.execute({
                userId: 'user-01',
                gymId: 'gym-01'
            })
        }).rejects.toBeInstanceOf(Error)
    })
```

Perceba que aqui estamos usando o tipo de erro genérico, **Error**, para ver se a promise foi rejeitada ou não. Isso, claro, porque como as regras de negócio ainda não foram implementadas, é normal supor que as ferramentas auxiliares a ela, como os erros personalizados, também não existem ainda.