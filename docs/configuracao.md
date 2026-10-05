# Configuração

## Variáveis de ambiente

Localmente vivem no `.env` na raiz do projeto (que está no `.gitignore`).
Em produção vivem nos **secrets do Lovable**. Sempre que se acrescenta uma variável, tem
de ser definida nos dois sítios.

**Como o `.env` chega ao servidor em local.** O `vite.config.ts` carrega-o para
`process.env` com `process.loadEnvFile`, só se o ficheiro existir (no Lovable não existe,
e lá não faz nada). Nem o Vite nem o `bun dev` o fazem sozinhos: o Vite só expõe variáveis
`VITE_*`, e apenas ao frontend; o Bun lê o `.env` para o seu próprio processo, mas não o
passa ao Vite, que corre em Node. Duas consequências:

- **Depois de alterar o `.env`, parar e voltar a arrancar o `bun dev`.** Os valores já
  carregados não são substituídos, nem quando o Vite reinicia sozinho.
- **Nunca dar o prefixo `VITE_` a uma variável secreta.** Tudo o que começa por `VITE_`
  vai parar ao código que corre no navegador.

**Formato das linhas: `NOME=valor`, sem espaços à volta do `=`.** Uma linha como
`ADMIN_UID = ` (espaço depois do `=` e sem valor) faz o leitor do Node "engolir" a linha
seguinte: a variável vazia fica com o texto da linha de baixo, e essa deixa de ser lida.
Variáveis ainda por preencher ficam como `ADMIN_UID=`.

| Variável | Para que serve | Onde obter |
|---|---|---|
| `GEMINI_API_KEY` | Chatbot e interpretação dos pedidos | Google AI Studio → Get API key |
| `GEMINI_MODEL` | Opcional. Modelo a tentar primeiro, antes dos modelos de reserva definidos em `src/lib/gemini.server.ts`. Um nome que não exista (404) é ignorado | Nome de um modelo do Google AI Studio, ex: `gemini-3.6-flash` |
| `FIREBASE_SERVICE_ACCOUNT` | Autenticação do servidor ao Firestore | Consola Firebase → Definições do projeto → Contas de serviço → gerar chave privada (JSON), guardado em base64 |
| `RESEND_API_KEY` | Envio da notificação interna | resend.com → API Keys |
| `EMAIL_ALUNO` | Destinatário das notificações | O email associado à conta Resend |
| `APP_BASE_URL` | Construir os links absolutos das propostas | `https://linha-digital-assist.lovable.app` |
| `ADMIN_UID` | Único utilizador autorizado no `/admin` | Obtém-se após o primeiro login Google |

## O que é secreto e o que não é

**Secreto, só no servidor:** `GEMINI_API_KEY`, `RESEND_API_KEY`,
`FIREBASE_SERVICE_ACCOUNT`.

**Não secreto, pode ficar no frontend:** a configuração web do Firebase (`apiKey`,
`authDomain`, `projectId`). Apesar do nome, o `apiKey` do SDK web não é uma credencial —
é um identificador público do projeto. O que impede acessos indevidos são as regras de
segurança do Firestore e a verificação de autorização no backend.

## Serviços externos

### Firebase
- Projeto criado em console.firebase.google.com
- **Cloud Firestore** ativo, em modo de produção
- **Authentication** com o método de início de sessão **Google** ativo
- Regras de segurança que impedem leituras e escritas públicas diretas nas coleções

### Resend
- Conta criada com o email onde as notificações devem chegar
- Remetente fixo: `onboarding@resend.dev`
- **Sem domínio próprio, o Resend só aceita enviar para o email da própria conta.** É por
  isso que a notificação vai para o aluno e não para o cliente.

### Google AI Studio
- Chave do Gemini com quota gratuita
- Não ativar billing nem mudar para modelos pagos
- **Quota gratuita: 20 pedidos por dia, por modelo, contados por projeto e não por chave**
  (verificado a 5 de outubro de 2026). Renova à meia-noite da hora do Pacífico, cerca das
  8h00 em Lisboa. Os testes locais gastam a mesma quota que o site publicado, se a chave for
  do mesmo projeto. Por isso o código usa vários modelos de reserva (cada um tem a sua
  quota) e salta logo um modelo cuja quota diária acabou.
- Uso atual e limites: https://aistudio.google.com/rate-limit

### Cal.com
- Evento "Diagnóstico gratuito", 15 a 20 minutos
- Ligado ao Google Calendar, com verificação de conflitos ativa
- Link: https://cal.com/daniel-alves-qijnqz/15min

## Limites gratuitos a ter em conta

Todos os serviços usados têm camada gratuita, com limites diários ou mensais. Não
prometer gratuitidade ilimitada. Se alguma funcionalidade depender de um plano pago,
explicar a limitação e manter o resto funcional.
