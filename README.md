# Linha Digital

Landing page e sistema de pedidos de proposta da **Linha Digital**, um estúdio web
freelance que cria e moderniza sites para pequenos negócios de Sintra e da Linha de
Sintra.

Projeto da cadeira de **Desenvolvimento Ágil de Software** — ISCTE-IUL Sintra, 2026/2027.
Autor: Daniel Alves.

🔗 **https://linha-digital-assist.lovable.app**

## O que faz

- **Landing page** com apresentação da oferta, três pacotes e 12 perguntas frequentes
- **Chatbot** com Google Gemini, restringido ao domínio do negócio
- **Agendamento** de diagnóstico gratuito via Cal.com, ligado ao Google Calendar
- **Pedidos de proposta**: formulário → interpretação por IA → cálculo com os preços do
  catálogo → página individual da proposta → notificação por email ao negócio. O cliente
  nunca recebe emails.
- **Área de administração** (`/admin`, login com Google): consultar pedidos e propostas,
  filtrar por estado, processar de novo, resolver revisões, reenviar notificações e gerir o
  catálogo

A IA interpreta o pedido; os preços vêm da base de dados e o cálculo é feito pelo código.
Os preços do catálogo são **fictícios**, só para demonstração — a Linha Digital não publica
preços.

**Estado:** protótipo 2 concluído e verificado no site publicado a 6 de outubro de 2026. O que
fica por fazer está em [`docs/prototipo-2.md`](docs/prototipo-2.md), secção "Estado atual".

## Stack

React 19 · TanStack Start · Vite · Tailwind CSS v4 ·
Google Gemini API · Cloud Firestore · Firebase Authentication · Resend · Cal.com

Alojado no Lovable Cloud, com sincronização bidirecional com este repositório.

## Começar

```bash
bun install   # usar bun, não npm nem pnpm
bun dev
```

Requer um ficheiro `.env` na raiz. Ver [`docs/configuracao.md`](docs/configuracao.md)
para a lista de variáveis e como as obter.

Para criar o catálogo de demonstração no Firestore (não reescreve serviços que já existam):

```bash
bun scripts/seed-catalogo.ts
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Regras do projeto e contexto para assistentes de código |
| [`docs/configuracao.md`](docs/configuracao.md) | Variáveis de ambiente e serviços externos |
| [`docs/negocio.md`](docs/negocio.md) | Público-alvo, oferta, tom de voz e identidade visual |
| [`docs/prototipo-2.md`](docs/prototipo-2.md) | Requisitos do protótipo 2 e registo de decisões e problemas |

## Segurança

As chaves de API vivem nos secrets da plataforma de alojamento e, em local, num `.env`
que não é versionado. Nenhuma credencial existe em código do frontend: as chamadas a
serviços externos passam por funções de servidor.

A configuração web do Firebase presente no frontend (`apiKey`, `authDomain`,
`projectId`) não é secreta — são identificadores públicos do projeto, e o acesso aos
dados é controlado pelas regras de segurança do Firestore e pela verificação de
autorização no backend.
