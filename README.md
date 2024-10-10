🎲 Plataforma Web de Apostas em Eventos Futuros

🌟 Descrição Geral
Bem-vindo ao nosso projeto de Plataforma Web de Apostas! Este sistema permite aos usuários criar e aceitar apostas sobre diversos eventos futuros, como resultados de jogos esportivos, eleições ou eventos extraordinários como catástrofes. A plataforma simula o controle financeiro, oferecendo uma experiência interativa e divertida para todos os usuários.


🚀 Funcionalidades
Módulo 1: Participante da Plataforma (Usuário Apostador e/ou Lançador de Eventos)

🔑 Cadastro e Login

Cadastro: Forneça nome, email, senha e data de nascimento para criar uma conta.
Login: Acesse sua conta e comece a criar eventos ou fazer apostas.

📝 Criação de Eventos

Após o login, você pode criar eventos informando título (até 50 caracteres), descrição curta (até 150 caracteres), valor de cada cota, período de apostas e data do evento.

🔍 Navegar e Encontrar Eventos

Use o mecanismo de busca para encontrar eventos ou explore destaques como eventos próximos de vencer, mais apostados e categorias como Olimpíada, Catástrofes, Eleições, Bolsa de Valores.

💳 Minha Wallet (Simulação de Cartão de Crédito)

Carregue sua carteira virtual com créditos simulados, visualize transações e saque saldo com facilidade.

💰 Apostar em Eventos

Escolha um evento e aposte se ele acontecerá ou não. Verifique o saldo e confirme a aposta. O valor apostado será descontado imediatamente.
Módulo 2: Gerenciamento da Plataforma (Backend)

✔️ Avaliar Novos Eventos

Moderadores aprovam ou reprovam eventos cadastrados. Eventos aprovados serão publicados, e eventos reprovados notificarão o criador por email.

🏁 Finalizar Eventos e Suas Apostas

Após o evento, o moderador informa se ocorreu ou não e distribui os fundos dos apostadores vencedores proporcionalmente.

❗ Requisitos e Restrições
🔒 Não Implementado: Troca de senha, alteração de email, confirmação de conta via email, notificações de acesso, autenticação de dois fatores.
👤 Cadastro de Moderador: Moderadores são adicionados diretamente ao banco de dados.
⚖️ Disputa: Não há mecanismos de reparação para disputas sobre eventos.
🚫 Outras Funcionalidades: Ranking de apostadores, perfil de usuários, comentários e qualificação de eventos não serão implementados neste momento.

🛠️ Tecnologias do Projeto
Frontend: HTML, CSS, JavaScript.
Backend: Typescript e Node.js OU Python e Flask.
Banco de Dados: Relacional (Oracle, PostgreSQL, ou MySQL).
Ambientes de Desenvolvimento: Visual Studio Code.
Frameworks: Nenhum (foco na construção de aplicações web sem frameworks).

🗂️ Roteiro de Implementação

Parte 1 - Backend:

Implementar serviços essenciais como cadastro, login, criação e avaliação de eventos, adição e saque de fundos, e apostas.
Parte 2 - Apostas:

Serviços relacionados ao processo de aposta, incluindo adicionar e sacar fundos, e finalizar eventos.
Parte 3 - Frontend:

Desenvolver a interface da aplicação.
Parte 4 - Integração:

Integrar frontend e backend, ajustar serviços conforme necessário e realizar testes completos.

📝 Nota Importante
Este modelo de desenvolvimento linear é adotado para fins educacionais, ajudando os alunos a aprender todos os processos de desenvolvimento de software web. Em ambientes profissionais, o desenvolvimento pode ser mais dinâmico e adaptável.

# Template para criar backends usando express

Este é um projeto apenas de "esqueleto" para você criar seu backend em TypeScript usando express.

## Instalando as dependências

Ao fazer o clone do repositório, basta rodar o comando: 

```
npm install
```
O comando acima instalará todas as dependências que constam no arquivo package.json.

## Iniciando o servidor

Para garantir que seu código esteja funcionando, na raíz do projeto rode o comando: 

```
npm run build
```
Como consequência, será gerado o diretório build constando o arquivo server.js. 

Acesse o diretório onde está o arquivo server.js (build/src) e digite o comando
```
node server.js
```

## Usando o nodemon

Em muitos casos não desejamos a todo momento ficar alterando nosso código e sempre digitando diversos comandos para testar aquilo que estamos fazendo. Pensando nisso, o projeto nodemon resolve esse problema. 

Experimente o comando

```
npm run dev
```

Voilà!
