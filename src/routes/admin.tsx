import { createFileRoute } from "@tanstack/react-router";
import type { User } from "firebase/auth";
import { LogOut, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  adminCatalogo,
  adminDetalhePedido,
  adminGuardarItem,
  adminListarPedidos,
  adminNotificar,
  adminReprocessar,
  adminResolver,
  adminSessao,
} from "@/lib/admin.functions";
import type { DetalhePedido, LinhaPedido } from "@/lib/admin.server";
import type { ItemCatalogo } from "@/lib/catalogo.server";
import { carregarAuth } from "@/lib/firebase-web";
import type { EstadoPedido } from "@/lib/pedidos.server";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração | Linha Digital" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Token = () => Promise<string>;

type Sessao =
  | { estado: "a_carregar" }
  | { estado: "anonimo"; erro: string | null }
  | { estado: "sem_acesso"; uid: string; email: string | null }
  | { estado: "admin"; user: User };

const ESTADOS: Record<EstadoPedido, string> = {
  recebido: "Recebido",
  em_analise: "Em análise",
  necessita_revisao: "Necessita de revisão",
  proposta_criada: "Proposta criada",
  erro: "Erro",
};

// Same list as ESTADOS_REPROCESSAVEIS in admin.server.ts, which is what the server enforces.
const REPROCESSAVEIS: EstadoPedido[] = ["erro", "recebido", "em_analise"];

const NOTIFICACOES: Record<string, string> = {
  por_enviar: "Por enviar",
  aceite: "Aceite pelo serviço",
  falhou: "Falhou",
  nao_configurado: "Não configurado",
  a_enviar: "Por confirmar",
};

const botao =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition disabled:opacity-50";
const botaoPrimario = `${botao} bg-primary text-primary-foreground hover:bg-primary/90`;
const botaoSecundario = `${botao} border border-border bg-card hover:bg-secondary`;
const campo =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary";

function AdminPage() {
  const [sessao, setSessao] = useState<Sessao>({ estado: "a_carregar" });

  useEffect(() => {
    let ativo = true;
    let cancelar: (() => void) | undefined;
    carregarAuth()
      .then(({ auth, onAuthStateChanged }) => {
        if (!ativo) return;
        cancelar = onAuthStateChanged(auth, async (user) => {
          if (!user) return setSessao({ estado: "anonimo", erro: null });
          try {
            const r = await adminSessao({ data: { idToken: await user.getIdToken() } });
            setSessao(
              r.autorizado
                ? { estado: "admin", user }
                : { estado: "sem_acesso", uid: user.uid, email: user.email },
            );
          } catch {
            setSessao({ estado: "anonimo", erro: "Não foi possível confirmar o acesso." });
          }
        });
      })
      .catch(() =>
        setSessao({ estado: "anonimo", erro: "Não foi possível carregar o início de sessão." }),
      );
    return () => {
      ativo = false;
      cancelar?.();
    };
  }, []);

  async function entrar() {
    try {
      const { auth, GoogleAuthProvider, signInWithPopup } = await carregarAuth();
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      setSessao({
        estado: "anonimo",
        erro:
          code === "auth/popup-blocked"
            ? "O navegador bloqueou a janela de início de sessão. Permita janelas pop-up para este site e tente outra vez."
            : "Não foi possível iniciar sessão. Tente outra vez.",
      });
    }
  }

  async function sair() {
    const { auth, signOut } = await carregarAuth();
    await signOut(auth);
  }

  const comSessao = sessao.estado === "admin" || sessao.estado === "sem_acesso";
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-deep-foreground/10 bg-deep text-deep-foreground">
        <div className="section-shell flex h-18 items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 font-display text-lg font-bold">
            <span className="grid size-9 place-items-center rounded-md bg-coral text-coral-foreground">
              LD
            </span>
            <span className="hidden sm:inline">Linha Digital</span>
            <span className="text-sm font-semibold text-deep-foreground/70">Administração</span>
          </a>
          {comSessao && (
            <button
              onClick={() => void sair()}
              className="inline-flex items-center gap-2 text-sm text-deep-foreground/80 hover:text-deep-foreground"
            >
              <LogOut size={16} /> Sair
            </button>
          )}
        </div>
      </header>

      <main className="section-shell max-w-5xl flex-1 py-10">
        {sessao.estado === "a_carregar" && <p className="text-muted-foreground">A carregar…</p>}

        {sessao.estado === "anonimo" && (
          <div className="max-w-md">
            <h1 className="text-3xl font-semibold">Área de administração</h1>
            <p className="mt-3 text-muted-foreground">Entre com a conta Google do administrador.</p>
            {sessao.erro && <Alerta>{sessao.erro}</Alerta>}
            <button onClick={() => void entrar()} className={`${botaoPrimario} mt-6`}>
              Entrar com Google
            </button>
          </div>
        )}

        {sessao.estado === "sem_acesso" && (
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold">Sem acesso</h1>
            <p className="mt-3 text-muted-foreground">
              A conta {sessao.email ?? "com que entrou"} não é a conta de administrador.
            </p>
            <div className="mt-6 rounded-lg border border-border bg-card p-5 text-sm leading-6">
              Se esta é a sua conta, defina <code className="font-semibold">ADMIN_UID</code> com o
              identificador abaixo no <code>.env</code> e nos secrets do Lovable, e volte a entrar:
              <code className="mt-3 block break-all rounded bg-secondary px-3 py-2 font-mono text-xs">
                {sessao.uid}
              </code>
            </div>
          </div>
        )}

        {sessao.estado === "admin" && <Painel user={sessao.user} />}
      </main>
    </div>
  );
}

function Painel({ user }: { user: User }) {
  const token = useCallback(() => user.getIdToken(), [user]);
  const [separador, setSeparador] = useState<"pedidos" | "catalogo">("pedidos");
  return (
    <>
      <p
        role="note"
        className="rounded-md border border-coral/40 bg-coral/10 px-4 py-3 text-sm leading-6"
      >
        <strong>Modo de aula:</strong> as notificações são enviadas apenas para o email do aluno. Os
        clientes não recebem emails.
      </p>
      <div role="tablist" className="mt-6 flex gap-2 border-b border-border">
        {(["pedidos", "catalogo"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={separador === s}
            onClick={() => setSeparador(s)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-bold ${
              separador === s
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {s === "pedidos" ? "Pedidos" : "Catálogo"}
          </button>
        ))}
      </div>
      {separador === "pedidos" ? <Pedidos token={token} /> : <Catalogo token={token} />}
    </>
  );
}

function Alerta({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {children}
    </p>
  );
}

function Pedidos({ token }: { token: Token }) {
  const [linhas, setLinhas] = useState<LinhaPedido[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<EstadoPedido | "todos">("todos");
  const [aberto, setAberto] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const r = await adminListarPedidos({ data: { idToken: await token() } });
      if (r.ok) setLinhas(r.dados);
      else setErro(r.erro);
    } catch {
      setErro("Não foi possível carregar os pedidos.");
    }
  }, [token]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const visiveis = (linhas ?? []).filter((l) => filtro === "todos" || l.estado === filtro);
  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="text-sm font-semibold">
          Estado
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as EstadoPedido | "todos")}
            className={`${campo} mt-1 w-auto`}
          >
            <option value="todos">Todos</option>
            {Object.entries(ESTADOS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => void carregar()} className={botaoSecundario}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>
      {erro && <Alerta>{erro}</Alerta>}
      {linhas === null && !erro && <p className="mt-6 text-muted-foreground">A carregar…</p>}
      {linhas && visiveis.length === 0 && (
        <p className="mt-6 text-muted-foreground">Não há pedidos para mostrar.</p>
      )}
      <ul className="mt-4 space-y-3">
        {visiveis.map((linha) => (
          <li key={linha.id} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{linha.criadoEm}</p>
                <p className="mt-1 font-semibold">
                  {linha.nome}{" "}
                  <span className="break-all font-normal text-muted-foreground">
                    · {linha.email}
                  </span>
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{linha.resumo}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1 text-sm md:items-end md:text-right">
                <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                  {ESTADOS[linha.estado] ?? linha.estado}
                </span>
                {linha.valor && <p className="font-semibold">{linha.valor}</p>}
                <p className="text-xs text-muted-foreground">
                  Notificação ao aluno:{" "}
                  {linha.estadoNotificacao
                    ? (NOTIFICACOES[linha.estadoNotificacao] ?? linha.estadoNotificacao)
                    : "—"}
                </p>
                {linha.propostaId && linha.estadoNotificacao !== "aceite" && (
                  <EnviarNotificacao
                    propostaId={linha.propostaId}
                    erro={linha.erroNotificacao}
                    token={token}
                    onAlterado={() => void carregar()}
                  />
                )}
                {linha.link && (
                  <a
                    href={linha.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-primary underline underline-offset-4"
                  >
                    Abrir proposta
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={() => setAberto(aberto === linha.id ? null : linha.id)}
              className="mt-3 text-sm font-semibold text-primary"
            >
              {aberto === linha.id ? "Fechar detalhe" : "Ver detalhe"}
            </button>
            {aberto === linha.id && (
              <Detalhe id={linha.id} token={token} onAlterado={() => void carregar()} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function EnviarNotificacao({
  propostaId,
  erro,
  token,
  onAlterado,
}: {
  propostaId: string;
  erro: string | null;
  token: Token;
  onAlterado: () => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function enviar() {
    setOcupado(true);
    try {
      const r = await adminNotificar({ data: { idToken: await token(), id: propostaId } });
      setMensagem(r.ok ? r.dados : r.erro);
    } catch {
      setMensagem("Não foi possível enviar a notificação.");
    }
    setOcupado(false);
    onAlterado();
  }

  return (
    <div className="flex flex-col gap-1 md:items-end">
      {erro && <p className="max-w-xs text-xs text-destructive">{erro}</p>}
      <button
        onClick={() => void enviar()}
        disabled={ocupado}
        className="text-xs font-bold text-primary underline underline-offset-4 disabled:opacity-50"
      >
        {ocupado ? "A enviar…" : "Enviar notificação"}
      </button>
      {mensagem && <p className="max-w-xs text-xs text-muted-foreground">{mensagem}</p>}
    </div>
  );
}

function Detalhe({ id, token, onAlterado }: { id: string; token: Token; onAlterado: () => void }) {
  const [detalhe, setDetalhe] = useState<DetalhePedido | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const r = await adminDetalhePedido({ data: { idToken: await token(), id } });
      if (r.ok) setDetalhe(r.dados);
      else setErro(r.erro);
    } catch {
      setErro("Não foi possível carregar o pedido.");
    }
  }, [id, token]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function repetir() {
    setOcupado(true);
    setMensagem("A processar… pode demorar até um minuto.");
    try {
      const r = await adminReprocessar({ data: { idToken: await token(), id } });
      setMensagem(r.ok ? r.dados : r.erro);
    } catch {
      setMensagem("Não foi possível repetir o processamento.");
    }
    setOcupado(false);
    await carregar();
    onAlterado();
  }

  if (erro) return <Alerta>{erro}</Alerta>;
  if (!detalhe) return <p className="mt-4 text-sm text-muted-foreground">A carregar…</p>;
  const { interpretacao } = detalhe;
  return (
    <div className="mt-4 space-y-5 border-t border-border pt-4 text-sm leading-6">
      <div>
        <h3 className="font-semibold">Pedido original</h3>
        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detalhe.textoOriginal}</p>
      </div>
      {interpretacao && (
        <div>
          <h3 className="font-semibold">Interpretação da IA</h3>
          <p className="mt-1 text-muted-foreground">{interpretacao.resumo}</p>
          {interpretacao.prazoPedido && (
            <p className="mt-1 text-muted-foreground">Prazo pedido: {interpretacao.prazoPedido}</p>
          )}
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {interpretacao.itens.map((item) => (
              <li key={item.catalogoId}>
                <span className="font-semibold">{item.catalogoId}</span> ×{" "}
                {item.quantidade ?? "por confirmar"}{" "}
                <span className="text-muted-foreground">— “{item.evidencia}”</span>
              </li>
            ))}
          </ul>
          {interpretacao.informacaoEmFalta.length > 0 && (
            <>
              <h4 className="mt-3 font-semibold">Informação em falta</h4>
              <ul className="list-disc pl-5 text-muted-foreground">
                {interpretacao.informacaoEmFalta.map((info) => (
                  <li key={info}>{info}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {detalhe.motivoRevisao && (
        <p className="rounded-md bg-secondary px-4 py-3">
          <span className="font-semibold">Motivo da revisão:</span> {detalhe.motivoRevisao}
        </p>
      )}
      {detalhe.erros.length > 0 && (
        <div>
          <h3 className="font-semibold">Erros de processamento</h3>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">
            {detalhe.erros.map((e, i) => (
              <li key={i}>
                {e.em}: {e.mensagem}
              </li>
            ))}
          </ul>
        </div>
      )}
      {REPROCESSAVEIS.includes(detalhe.estado) && (
        <button onClick={() => void repetir()} disabled={ocupado} className={botaoPrimario}>
          Processar de novo
        </button>
      )}
      {detalhe.estado === "necessita_revisao" && (
        <Resolver
          id={id}
          token={token}
          iniciais={(interpretacao?.itens ?? []).map((i) => ({
            catalogoId: i.catalogoId,
            quantidade: i.quantidade ?? 1,
          }))}
          onResolvido={() => {
            void carregar();
            onAlterado();
          }}
        />
      )}
      {mensagem && <p className="text-muted-foreground">{mensagem}</p>}
    </div>
  );
}

type Linha = { catalogoId: string; quantidade: number };

function Resolver({
  id,
  token,
  iniciais,
  onResolvido,
}: {
  id: string;
  token: Token;
  iniciais: Linha[];
  onResolvido: () => void;
}) {
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([]);
  const [linhas, setLinhas] = useState<Linha[]>(iniciais);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    void (async () => {
      const r = await adminCatalogo({ data: { idToken: await token() } });
      if (!r.ok) return setMensagem(r.erro);
      const ativos = r.dados.filter((i) => i.ativo);
      setCatalogo(ativos);
      setLinhas((atuais) =>
        atuais.length > 0 ? atuais : ativos[0] ? [{ catalogoId: ativos[0].id, quantidade: 1 }] : [],
      );
    })();
  }, [token]);

  const mudar = (indice: number, alteracao: Partial<Linha>) =>
    setLinhas((atuais) => atuais.map((l, i) => (i === indice ? { ...l, ...alteracao } : l)));

  async function criar() {
    setOcupado(true);
    setMensagem(null);
    try {
      const r = await adminResolver({ data: { idToken: await token(), id, itens: linhas } });
      if (!r.ok) setMensagem(r.erro);
      else {
        setMensagem(r.dados.mensagem);
        if (r.dados.ok) onResolvido();
      }
    } catch {
      setMensagem("Não foi possível criar a proposta.");
    }
    setOcupado(false);
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="font-semibold">Resolver revisão</h3>
      <p className="mt-1 text-muted-foreground">
        Escolha os serviços e as quantidades. O preço vem sempre do catálogo.
      </p>
      <div className="mt-3 space-y-2">
        {linhas.map((linha, indice) => (
          <div key={indice} className="flex flex-wrap items-center gap-2">
            <select
              value={linha.catalogoId}
              onChange={(e) => mudar(indice, { catalogoId: e.target.value })}
              className={`${campo} w-auto min-w-0 flex-1`}
              aria-label="Serviço"
            >
              {catalogo.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={100}
              value={linha.quantidade}
              onChange={(e) => mudar(indice, { quantidade: Math.max(1, Number(e.target.value)) })}
              className={`${campo} w-20`}
              aria-label="Quantidade"
            />
            <button
              onClick={() => setLinhas((atuais) => atuais.filter((_, i) => i !== indice))}
              className="p-2 text-muted-foreground hover:text-destructive"
              aria-label="Remover serviço"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() =>
            catalogo[0] &&
            setLinhas((atuais) => [...atuais, { catalogoId: catalogo[0]!.id, quantidade: 1 }])
          }
          className={botaoSecundario}
        >
          <Plus size={16} /> Adicionar serviço
        </button>
        <button
          onClick={() => void criar()}
          disabled={ocupado || linhas.length === 0}
          className={botaoPrimario}
        >
          Calcular e criar proposta
        </button>
      </div>
      {mensagem && <p className="mt-3 text-muted-foreground">{mensagem}</p>}
    </div>
  );
}

const VAZIO: Omit<ItemCatalogo, "id"> = {
  nome: "",
  descricao: "",
  unidade: "pacote",
  precoUnitarioCentimos: 0,
  moeda: "EUR",
  recorrencia: "unica",
  ativo: true,
  condicoes: "Preço fictício, apenas para demonstração.",
  precoFicticio: true,
};

function Catalogo({ token }: { token: Token }) {
  const [itens, setItens] = useState<ItemCatalogo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await adminCatalogo({ data: { idToken: await token() } });
      if (r.ok) setItens(r.dados);
      else setErro(r.erro);
    } catch {
      setErro("Não foi possível carregar o catálogo.");
    }
  }, [token]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (erro) return <Alerta>{erro}</Alerta>;
  if (!itens) return <p className="mt-6 text-muted-foreground">A carregar…</p>;
  return (
    <section className="mt-6 space-y-4">
      <p className="text-sm text-muted-foreground">
        O catálogo é a única fonte de preços das propostas. Um serviço inativo deixa de ser enviado
        à IA e de entrar em propostas novas; as propostas já emitidas não mudam.
      </p>
      {itens.map((item) => (
        <ItemForm key={item.id} item={item} novo={false} token={token} onGuardado={carregar} />
      ))}
      <details className="rounded-lg border border-dashed border-border p-5">
        <summary className="cursor-pointer text-sm font-bold">Novo serviço</summary>
        <ItemForm item={{ id: "", ...VAZIO }} novo token={token} onGuardado={carregar} />
      </details>
    </section>
  );
}

function ItemForm({
  item,
  novo,
  token,
  onGuardado,
}: {
  item: ItemCatalogo;
  novo: boolean;
  token: Token;
  onGuardado: () => Promise<void>;
}) {
  const [dados, setDados] = useState(item);
  const [preco, setPreco] = useState(
    (item.precoUnitarioCentimos / 100).toFixed(2).replace(".", ","),
  );
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const mudar = (alteracao: Partial<ItemCatalogo>) => setDados((d) => ({ ...d, ...alteracao }));

  async function guardar() {
    const valor = Number(preco.replace(/[\s€]/g, "").replace(",", "."));
    if (!Number.isFinite(valor) || valor < 0) return setMensagem("Preço inválido.");
    if (novo && !/^[a-z0-9-]{2,40}$/.test(dados.id)) {
      return setMensagem("Identificador inválido: use letras minúsculas, números e hífens.");
    }
    setOcupado(true);
    try {
      const { id, ...resto } = dados;
      const r = await adminGuardarItem({
        data: {
          idToken: await token(),
          id,
          novo,
          dados: { ...resto, precoUnitarioCentimos: Math.round(valor * 100) },
        },
      });
      setMensagem(r.ok ? r.dados.mensagem : r.erro);
      if (r.ok && r.dados.ok) await onGuardado();
    } catch {
      setMensagem("Não foi possível guardar.");
    }
    setOcupado(false);
  }

  return (
    <div className={novo ? "mt-4" : "rounded-lg border border-border bg-card p-5 shadow-sm"}>
      <div className="grid gap-3 sm:grid-cols-2">
        {novo ? (
          <label className="text-sm font-semibold">
            Identificador
            <input
              value={dados.id}
              onChange={(e) => mudar({ id: e.target.value.trim() })}
              placeholder="ex.: galeria-fotos"
              className={`${campo} mt-1`}
            />
          </label>
        ) : (
          <p className="text-sm">
            <span className="font-semibold">Identificador:</span> {item.id}
          </p>
        )}
        <label className="text-sm font-semibold">
          Nome
          <input
            value={dados.nome}
            onChange={(e) => mudar({ nome: e.target.value })}
            className={`${campo} mt-1`}
          />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Descrição
          <textarea
            value={dados.descricao}
            onChange={(e) => mudar({ descricao: e.target.value })}
            rows={2}
            className={`${campo} mt-1`}
          />
        </label>
        <label className="text-sm font-semibold">
          Preço unitário (€, sem IVA)
          <input
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            inputMode="decimal"
            className={`${campo} mt-1`}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold">
            Unidade
            <select
              value={dados.unidade}
              onChange={(e) => mudar({ unidade: e.target.value as ItemCatalogo["unidade"] })}
              className={`${campo} mt-1`}
            >
              <option value="pacote">Pacote</option>
              <option value="unidade">Unidade</option>
              <option value="hora">Hora</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Pagamento
            <select
              value={dados.recorrencia}
              onChange={(e) =>
                mudar({ recorrencia: e.target.value as ItemCatalogo["recorrencia"] })
              }
              className={`${campo} mt-1`}
            >
              <option value="unica">Único</option>
              <option value="mensal">Mensal</option>
            </select>
          </label>
        </div>
        <label className="text-sm font-semibold sm:col-span-2">
          Condições
          <textarea
            value={dados.condicoes}
            onChange={(e) => mudar({ condicoes: e.target.value })}
            rows={2}
            className={`${campo} mt-1`}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={dados.ativo}
            onChange={(e) => mudar({ ativo: e.target.checked })}
          />
          Ativo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={dados.precoFicticio}
            onChange={(e) => mudar({ precoFicticio: e.target.checked })}
          />
          Preço fictício (demonstração)
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={() => void guardar()} disabled={ocupado} className={botaoPrimario}>
          {novo ? "Criar serviço" : "Guardar"}
        </button>
        {mensagem && <p className="text-sm text-muted-foreground">{mensagem}</p>}
      </div>
    </div>
  );
}
