# 🚀 Guia Rápido de Deploy: OX WebTV na Vercel

Bem-vindo ao guia de implantação da **OX WebTV**. Este documento foi criado para que o Guibson possa hospedar a plataforma na Vercel de forma rápida, segura e profissional, aproveitando a integração contínua com o GitHub.

---

## 🛠️ 1. Pré-requisitos (No seu Computador e no GitHub)

Antes de ir para a Vercel, o código precisa estar salvo no seu GitHub.
1. Certifique-se de que você tem uma conta ativa no [GitHub](https://github.com/).
2. Abra o terminal (ou Git Bash) na pasta principal do projeto (`OX_WebTV_Platform\frontend`) e rode os comandos abaixo para subir seu código:
   ```bash
   git init
   git add .
   git commit -m "🚀 Primeiro commit: OX WebTV pronta"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/ox-webtv.git
   git push -u origin main
   ```
   *(Nota: Crie o repositório `ox-webtv` vazio no GitHub antes de rodar os comandos)*

---

## 🌐 2. Passo a Passo Vercel

Com o código no GitHub, a mágica de deploy acontece em poucos cliques:

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard) e faça login usando a sua conta do GitHub.
2. Clique no botão preto **"Add New..."** no canto superior direito e selecionar **"Project"**.
3. A Vercel vai listar os seus repositórios do GitHub. Encontre o repositório `ox-webtv` e clique no botão **"Import"**.
4. **Configuração do Projeto (Project Settings):**
   - **Project Name:** Pode deixar `ox-webtv` ou renomear para `ox-webtv-platform`.
   - **Framework Preset:** A Vercel é super inteligente e vai detectar automaticamente que o projeto foi feito em **Next.js**. Deixe essa opção selecionada.
   - **Root Directory:** Como o código fonte (`package.json`, `src`, etc) está direto na pasta que você fez o push, pode deixar o padrão (`./`). *(Caso você tenha feito o push da pasta mãe inteira, clique em Edit e selecione a pasta `frontend`)*.

---

## 💡 3. Dica de Ouro (Build e Output)

Para que a Vercel não se perca e gere sua aplicação de forma impecável, verifique a aba **Build and Output Settings** (ela já vem pré-configurada, mas é bom conferir):

- **Build Command:** Deve estar como `next build` (ou `npm run build`). Se a caixa estiver com placeholder, a Vercel usará o padrão (que está correto).
- **Install Command:** Deve estar como `npm install`.
- **Output Directory:** Deve ser `.next`.

Neste projeto específico, não utilizamos variáveis de ambiente ocultas (`.env`) críticas no front-end por enquanto. Portanto, a aba **Environment Variables** pode ficar vazia.

---

## 🎉 4. Finalização e Deploy

1. Clique no botão azul gigante **"Deploy"**.
2. Agora é a hora do café ☕! A Vercel vai baixar o código, instalar as bibliotecas, rodar o processo de otimização (aquele que ajustamos juntos) e colocar o servidor no ar. Isso leva cerca de 1 a 2 minutos.
3. Assim que finalizar, choverá confetes virtuais na sua tela!
4. **O Grande Momento:** Clique no card da aplicação (ou no botão **"Continue to Dashboard"**) e no canto superior direito você verá o link de produção (exemplo: `https://ox-webtv.vercel.app`).

Pronto, Guibson! É só clicar nesse link mágico e a sua OX WebTV estará rodando de forma global, acessível do celular, computador ou smart TV em qualquer lugar do mundo!
