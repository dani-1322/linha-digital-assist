# Linha Digital

Responde sempre em **português europeu (PT-PT)**, nunca em português do Brasil.

Landing page e backend de pedidos de proposta da **Linha Digital**, um estúdio web
freelance que cria e moderniza sites para pequenos negócios de Sintra e da Linha de
Sintra. Trabalho académico da cadeira de Desenvolvimento Ágil de Software (ISCTE Sintra),
mas o negócio é real.

- **Site:** https://linha-digital-assist.lovable.app
- **Repositório:** https://github.com/dani-1322/linha-digital-assist

## Stack

React 19 · TanStack Start (encaminhamento e funções de servidor) · Vite ·
Tailwind CSS v4 · Google Gemini API · Cloud Firestore ·
Firebase Authentication · Resend · Cal.com · alojado no Lovable Cloud.

## Como correr

```bash
bun install
bun dev
```

Requer um `.env` na raiz. Ver `docs/configuracao.md` para a lista de variáveis.

## As cinco regras

1. **Nenhuma chave secreta em código do frontend.** Tudo o que exija credenciais passa
   por uma função de servidor (`createServerFn`) que lê `process.env`. Em produção as
   chaves vivem nos secrets do Lovable; localmente no `.env`, que está no `.gitignore`.
   Exceção conhecida: a configuração web do Firebase (`apiKey`, `authDomain`,
   `projectId`) **não é secreta** — são identificadores públicos, e o que protege os
   dados são as regras de segurança do Firestore.

2. **Usar `bun`, nunca `npm` nem `pnpm`.** O projeto tem `bun.lock` e é esse ficheiro que
   o Lovable usa para construir em produção. Instalar com outro gestor não o atualiza, e
   dependências novas deixam de ser instaladas — o site parte depois de publicar, mesmo
   funcionando em local.

3. **Nunca inventar prova social nem preços reais.** A Linha Digital não tem clientes nem
   preços publicados. É proibido gerar testemunhos, logótipos, avaliações, estatísticas
   ou números de clientes. Os preços do catálogo são registos de demonstração e têm de
   estar identificados como fictícios, tanto na base de dados como nas propostas geradas.

4. **Todo o texto visível em PT-PT.** "Telemóvel" e não "celular", "ecrã" e não "tela",
   "registo" e não "cadastro". Evitar gerúndios: "estamos a criar", não "estamos
   criando". O `<html>` tem `lang="pt-PT"`.

5. **Falhas de serviços externos têm de ser visíveis.** Se uma chamada a uma API falhar,
   a interface mostra uma mensagem em linguagem simples e um caminho alternativo. Nunca
   deixar a interface presa num estado de carregamento. Guardar sempre os dados antes de
   chamar serviços externos, e deixar o processamento repetível.

## Sincronização com o Lovable

O GitHub e o Lovable sincronizam **nos dois sentidos**. O código escreve-se localmente;
o Lovable é onde o site é alojado e publicado.

- `git pull` antes de começar a trabalhar
- `git push` envia; depois publica-se no Lovable ("Publish changes")
- **Não editar pelo chat do Lovable** enquanto se trabalha localmente

## Documentação

- `docs/configuracao.md` — variáveis de ambiente e serviços externos
- `docs/negocio.md` — público-alvo, oferta, tom de voz e identidade visual
- `docs/prototipo-2.md` — requisitos do trabalho em curso e registo de decisões
