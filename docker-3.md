# Docker
A ideia do Docker é "isolar" as necessidades/dependências de uma aplicação para (entre outros motivos) evitar que várias coisas sejam instaladas na máquina de desenvolvimento sem necessidade, sujando o ambiente de trabalho. O Docker nos permite, por exemplo, estar rodando uma aplicação que usa um banco de dados postgres, por exemplo, portanto o banco de dados está instalado no postgres mas, assim que a aplicação é desligada, esse banco de dados some junto com ela, eliminando a necessidade de estar instalada na máquina que executa a aplicação.

O Docker é uma espécie de máquina virtual, com a diferença que as máquinas virtuais reinstalam o sistema operacional delas todo do zero, funcionando de forma diferente e independente da máquina física onde está rodando. A diferença do Docker é que ela reaproveita o kernel do sistema operacional onde ele está sendo rodado, usando apenas o necessário para rodar as ferramentas contidas ele, como banco de dados, por exemplo.

O Docker, por fazer esse isolamento das dependências da aplicação, também permite que diferentes pessoas do time, com diferentes sistemas operacionais contribuam para o projeto sem ter grandes problemas de compatibilidade dessas ferramentas. 

## Imagens
Para usar o docker vamos precisar acessar o **dockerhub**, que possui as imagens dessas ferramentas que podemos incluir no nosso Docker, e serão rodados a partir dele. Essas imagens nada mais são, de forma abstrata, do que os "scripts" que rodam as ferramentas. Como vamos usar o Postgres, poderíamos selecionar a imagem oficial do Postgres mas, por recomendação do Diegão, vamos usar a imagem fornecida pela bitnami, que faz algumas verificações a mais em relação a segurança.

## Criando um Container
Primeiro de tudo, já selecionamos qual imagem queremos usar no nosso container, que é [postgres da bitnami](https://hub.docker.com/r/bitnami/postgresql):

O comando básico para criar um Container com essa imagem seria:

```sh
    $ docker run --name {nome-do-recurso} {nome-da-imagem}

    $ docker run --name ignite-gympass-pg bitnami/postgresql
```

Isso já criaria um recurso PostgreSQL no nosso docker, mas ainda podemos passar algumas configurações, informadas no link acima, de variáveis de ambiente como usuário, senha, nome do banco, portas, etc. Para definir uma variável de ambiente para o docker, basta colocar a flag -e na frente, e seguir o padrão orientado na documentação.

```sh
    $ docker run --name ignite-gympass-pg -e POSTGRESQL_USERNAME=docker -e POSTGRESQL_PASSWORD=docker -e POSTGRESQL_DATABASE=ignite-gympass -p 5432:5432 bitnami/postgresql
```

Aqui inserimos um username, senha e nome para o nosso banco de dados, e também definimos uma flag **-p 5432:5432**. O Postgres, por padrão, roda sempre na porta 5432, mas ele estará rodando na porta 5432 do Docker, e nossa máquina física, de desenvolvimento, não tem acesso a ela. Esse comando diz para a nossa porta física 5432 (antes dos dois pontos) espelhar a porta 5432 do Docker (depois dos dois pontos). 

Para isso dar certo, no Windows, precisa (aparentemente) estar rodando o Docker Desktop. Somente no Windows, já que seu sistema operacional não tem como base o Unix.

## Executando um Container
O comando acima vai criar e executar o nosso container pela primeira vez. Nas próximas vezes que formos executar o nosso container, não tem necessidade de reescrever aquele comando todo, e nem seria possível pois tentaríamos criar um container com o mesmo nome novamente. 

Depois da primeira vez que rodamos/criamos um container, ele fica salvo para nós e disponível através do comando **docker ps**. Esse comando por si só, mostra todos os containers que estão rodando na nossa máquina, e o comando **docker ps -a** lista todos os containers que já rodaram na nossa máquina:

```sh
    $ docker ps -> Mostra os ativos

    $ docker ps -a -> Mostra todos que já rodaram
```

Rodando **docker ps -a** podemos ver esse nosso container criado com um ID atribuído pelo docker. Podemos rodar ele novamente executando:

```sh
    $ docker start {nome-do-container}
    $ docker start ignite-gympass-pg
    ou
    $ docker start {id-do-container}
```

E para interrompê-lo:

```sh
    $ docker stop {nome-do-container}
    ou
    $ docker stop {id-do-container}
```

Podemos, também deletar um recurso do docker:
```sh
    $ docker rm {nome-do-container}
```

Para testar de forma mais definitiva, podemos adicionar os dados do nosso usuário postgresql à variável de ambiente da seguinte forma:

```
    DATABASE_URL="postgresql://docker:docker@localhost:5432/ignite-gympass?schema=public"
```

E vamos rodar um migrate no prisma (**com o docker rodando!**):

```sh
    $ npx prisma migrate dev
```

E vamos dar um nome pra nossa migration **create users** quando o terminal nos pedir por ele. Feito isso, nosso banco já deve ter a tabela users com as colunas id, name e mail, conforme definido no `prisma/schema.prisma`.

## Docker Compose
Até agora, definimos um container para o funcionamento apenas do Postgres. Quando uma pessoa do nosso time for fazer uso desse mesmo recurso na máquina dela, ela vai precisar rodar exatamente o mesmo comando **docker run** que fizemos acima para criar uma imagem igual a nossa. Isso não é muito interessante porque, conforme mais ferramentas vão sendo adicionadas ao nosso container, mais complexo e maior esse comando vai se tornando. 

Pra facilitar isso, existe o tal **Docker Compose**, que é usado em ambiente de desenvolvimento: `docker-compose.yml`. Esse yml vai basicamente traduzir aquele comando docker run em uma estrutura mais legível e simples. Aqui está o comando docker run:

```sh
    $ docker run --name ignite-gympass-pg -e POSTGRESQL_USERNAME=docker -e POSTGRESQL_PASSWORD=docker -e POSTGRESQL_DATABASE=ignite-gympass -p 5432:5432 bitnami/postgresql
```

E aqui está ele no formato **yml**, que vai no arquivo `docker-compose.yml`:
```yml
    version: '3'

    services:
        ignite-gympass-pg:
            image: bitnami/postgresql
            ports:
                - 5432:5432
            environment:
                - POSTGRESQL_USERNAME=docker
                - POSTGRESQL_PASSWORD=docker
                - POSTGRESQL_DATABASE=ignite-gympass
```

Então basicamente definimos:
- **nome do recurso**: que é o ignite-gympass-pg;
- **imagem usada**: como antes, estamos usando o postgresql da bitnami;
- **espelhamento de portas**: rodamos o 5432 e espelhamos ele na nossa 5432 local;
- **variáveis de ambiente**: username, senha e nome do banco

Agora, quando um integrante da equipe quiser subir esse mesmo docker na máquina dele, basta ele rodar
```sh
    $ docker compose up -d
```

Feito isso, o container será criado e já estará rodando, conforme o comando **docker ps** pode nos confirmar. Para interromper esse docker, basta rodar
```sh
    $ docker compose stop
```

É importante destacar a diferença entre o comando **docker compose stop** e o comando **docker compose down**. O comando **down** vai parar todos os containers e deletá-los junto com os dados que estiverem armazenados nele, por isso deve ser usado com muita cautela e cuidado.