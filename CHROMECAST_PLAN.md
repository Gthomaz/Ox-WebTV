# Integração de Transmissão (Chromecast & AirPlay)

O objetivo é adicionar a capacidade de transmitir os vídeos da OX WebTV (tanto a TV Ao Vivo quanto o Catálogo VOD) diretamente para Smart TVs usando Chromecast (Google) e AirPlay (Apple).

## O Problema Atual
Atualmente, o `ReactPlayer` não vem com um botão oficial do Chromecast embutido. Os usuários de iPhone já conseguem transmitir usando o AirPlay nativo do Safari, mas usuários de Android/PC precisam de um botão dedicado do Google Cast para jogar o conteúdo na TV de forma elegante.

## Tempo Estimado
**Médio (Cerca de 1 a 2 horas de desenvolvimento focado).**
Não é algo trivial de "5 minutos", pois precisamos injetar o framework do Google Cast, criar um botão flutuante e sincronizar o vídeo que está tocando no celular com o que vai tocar na TV.

## Proposta de Mudanças
Para que fique profissional igual à Netflix, propomos a seguinte abordagem:

### 1. Injetar o Framework do Google Cast
- **Arquivo:** `frontend/src/app/layout.tsx`
- Adicionar o script oficial do Google: `https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1`
- Inicializar o `CastContext` quando o app carregar.

### 2. Criar o Botão de Transmissão
- **Arquivo:** `frontend/src/components/CastButton.tsx` (Novo Componente)
- Criar um componente React que renderiza a tag oficial `<google-cast-launcher>`.
- Estilizar esse botão para que ele fique flutuando no canto superior direito do player, brilhando quando houver uma TV disponível na rede.

### 3. Sincronizar o Vídeo (Sender Logic)
- **Arquivos:** `frontend/src/components/VideoPlayer.tsx` e `frontend/src/app/watch/[id]/page.tsx`
- Interceptar o momento em que o usuário clica no botão de Cast.
- Pegar a URL do vídeo atual (`.mp4` ou `.m3u8`) e enviar o comando `loadMedia` para a TV conectada através da sessão ativa do Chromecast.
- Pausar o vídeo no celular enquanto a TV estiver tocando.

## Passos para Iniciar
Quando for o momento certo, abra este arquivo e peça para o Antigravity iniciar a implementação descrita acima.
