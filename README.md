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
- **Pedidos de proposta**: formulário → interpretação por IA → cálculo automático →
  página individual da proposta → notificação por email _(em desenvolvimento)_

## Stack

React 19 · TanStack Start · Vite · Tailwind CSS v4 · shadcn/ui ·
Google Gemini API · Cloud Firestore · Firebase Authentication · Resend · Cal.com

Alojado no Lovable Cloud, com sincronização bidirecional com este repositório.

## Começar

```bash
bun install   # usar bun, não npm nem pnpm
bun dev
```

Requer um ficheiro `.env` na raiz. Ver [`docs/configuracao.md`](docs/configuracao.md)
para a lista de variáveis e como as obter.

## Documentação

| Documento | Conteúdo |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Regras do projeto e contexto para assistentes de código |
| [`docs/configuracao.md`](docs/configuracao.md) | Variáveis de ambiente e serviços externos |
| [`docs/negocio.md`](docs/negocio.md) | Público-alvo, oferta, tom de voz e identidade visual |
| [`docs/prototipo-2.md`](docs/prototipo-2.md) | Requisitos em curso e registo de decisões |

## Segurança

As chaves de API vivem nos secrets da plataforma de alojamento e, em local, num `.env`
que não é versionado. Nenhuma credencial existe em código do frontend: as chamadas a
serviços externos passam por funções de servidor.

A configuração web do Firebase presente no frontend (`apiKey`, `authDomain`,
`projectId`) não é secreta — são identificadores públicos do projeto, e o acesso aos
dados é controlado pelas regras de segurança do Firestore e pela verificação de
autorização no backend.
