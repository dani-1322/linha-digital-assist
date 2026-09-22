import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight, CalendarDays, Check, ChevronDown, CircleUserRound, Clock3,
  Coffee, ExternalLink, GraduationCap, HeartPulse, Laptop, Mail, MapPin,
  Menu, MessageCircle, MonitorSmartphone, Scissors, Search, Settings,
  ShieldCheck, ShoppingBag, Sparkles, Store, Wrench, X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Linha Digital | Sites para negócios locais" },
      { name: "description", content: "Sites claros e modernos para pequenos negócios de Sintra e da Linha de Sintra. Marque um diagnóstico gratuito, sem compromisso." },
      { property: "og:title", content: "Linha Digital | O seu negócio, fácil de encontrar" },
      { property: "og:description", content: "Sites simples para negócios locais, sem complicações técnicas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const bookingHref = "#marcar";

function PrimaryLink({ children, className = "", tone = "primary" }: { children: ReactNode; className?: string; tone?: "primary" | "coral" }) {
  const tones = { primary: "bg-primary text-primary-foreground hover:bg-primary/90", coral: "bg-coral text-coral-foreground hover:bg-coral/90" } as const;
  return <a href={bookingHref} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md ${tones[tone]} px-5 py-3 text-sm font-bold shadow-lg ${tone === "coral" ? "shadow-coral/25" : "shadow-primary/20"} transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}>{children}</a>;
}

const businessTypes = [
  [Coffee, "Cafés"], [Scissors, "Cabeleireiros"], [Wrench, "Oficinas"],
  [GraduationCap, "Explicações"], [ShoppingBag, "Lojas"], [HeartPulse, "Clínicas"],
] as const;

const personas = [
  { icon: Coffee, role: "Café ou restaurante", pain: "Só tem Instagram e os clientes não encontram horários, menu ou localização.", goal: "Ter tudo o que importa num site simples e rápido." },
  { icon: Scissors, role: "Negócio de serviços", pain: "O site antigo fica mal no telemóvel e quase não gera contactos.", goal: "Receber mais pedidos e marcações sem complicações." },
  { icon: Wrench, role: "Loja ou oficina", pain: "Não tem tempo para domínios, alojamento ou problemas técnicos.", goal: "Ter alguém local e fiável a tratar do site." },
];

const extras = [
  [MessageCircle, "Botão WhatsApp", "Uma conversa começa com um toque."],
  [Mail, "Formulário de contacto", "Pedidos organizados, sem mensagens perdidas."],
  [MapPin, "Google Maps", "Os clientes chegam à sua porta sem dúvidas."],
  [Search, "Perfil no Google", "Mais hipóteses de aparecer nas pesquisas locais."],
  [Settings, "Domínio e alojamento", "Ajuda clara desde o nome até à publicação."],
  [MonitorSmartphone, "Pensado para telemóvel", "Uma boa experiência em qualquer ecrã."],
] as const;

const packages = [
  { name: "Essencial", subtitle: "Landing Page", items: ["Uma página moderna e adaptada a telemóvel", "Formulário de contacto e botão WhatsApp", "Mapa, localização e horários", "Ajuda com domínio e alojamento"] },
  { name: "Renovação", subtitle: "Reformular o site", featured: true, items: ["Novo visual para um site desatualizado", "Conteúdo reorganizado e mais claro", "Contactos por formulário, WhatsApp e email", "Ajuda a melhorar o Perfil de Empresa no Google"] },
  { name: "Manutenção", subtitle: "Acompanhamento mensal", monthly: true, items: ["Atualizações de textos e imagens", "Verificação regular do funcionamento", "Pequenos ajustes técnicos", "Número de alterações definido por mês"] },
];

const faqs = [
  ["Quanto tempo demora a ter o site pronto?", "Depende do pacote e do conteúdo disponível. Depois da conversa inicial, recebe um prazo claro antes de avançarmos. Uma página simples costuma ser mais rápida do que uma reformulação completa."],
  ["Preciso de perceber de tecnologia?", "Não. Explico cada passo em linguagem simples e trato consigo das decisões importantes, sem termos técnicos desnecessários."],
  ["O que são domínio e alojamento?", "O domínio é o endereço do site e o alojamento é o serviço que o mantém online. Estes serviços são pagos diretamente pelo cliente; ajudo a escolher e configurar opções adequadas."],
  ["Posso atualizar o conteúdo sozinho?", "Sim, se isso fizer sentido para o seu negócio. Podemos definir uma solução fácil de editar ou incluir alterações num plano de manutenção."],
  ["Já tenho site. Posso aproveitar alguma coisa?", "Sim. Primeiro analisamos o que existe e decidimos o que vale a pena manter, melhorar ou reorganizar."],
  ["O que inclui a manutenção mensal?", "Inclui atualizações de texto e imagens, verificações regulares e pequenos ajustes técnicos, dentro de um número de alterações acordado. Não inclui reformulações completas nem trabalho ilimitado."],
  ["O site funciona bem no telemóvel?", "Sim. Todos os sites são pensados primeiro para ecrãs pequenos e ajustados também a computadores e tablets."],
  ["O site ajuda a aparecer no Google?", "O site será preparado com boas bases para pesquisa e posso ajudar no Perfil de Empresa no Google. Nenhum profissional sério pode garantir uma posição específica nos resultados."],
  ["Como funciona o pagamento?", "As condições são apresentadas de forma clara na proposta, antes de começar. O valor depende do pacote e das necessidades definidas na conversa."],
  ["Posso cancelar a manutenção?", "Sim. As condições de cancelamento e o período aplicável ficam definidos de forma transparente antes de aderir."],
  ["O que acontece no diagnóstico gratuito?", "Falamos durante 15 a 20 minutos sobre o seu negócio, o que já existe e o que precisa. No fim, fica com uma recomendação clara, sem obrigação de avançar."],
  ["Que zonas são abrangidas?", "Trabalho sobretudo com negócios em Sintra e na Linha de Sintra, incluindo Cacém, Queluz, Agualva e Mem Martins, mas também podemos falar se estiver noutra zona."],
];

function SectionHeading({ kicker, title, text, light = false }: { kicker: string; title: string; text?: string; light?: boolean }) {
  return <div className="max-w-2xl"><p className={`mb-3 text-xs font-bold uppercase tracking-widest ${light ? "text-coral" : "text-primary"}`}>{kicker}</p><h2 className={`text-3xl font-semibold leading-tight sm:text-4xl ${light ? "text-deep-foreground" : "text-foreground"}`}>{title}</h2>{text && <p className={`mt-4 leading-7 ${light ? "text-deep-foreground/75" : "text-muted-foreground"}`}>{text}</p>}</div>;
}

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
    <header className="sticky top-0 z-50 border-b border-deep-foreground/10 bg-deep/95 text-deep-foreground backdrop-blur">
      <div className="section-shell flex h-18 items-center justify-between">
        <a href="#inicio" className="flex items-center gap-3 font-display text-lg font-bold"><span className="grid size-9 place-items-center rounded-md bg-coral text-coral-foreground">LD</span>Linha Digital</a>
        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex"><a className="text-sm text-deep-foreground/75 hover:text-deep-foreground" href="#servicos">Serviços</a><a className="text-sm text-deep-foreground/75 hover:text-deep-foreground" href="#pacotes">Pacotes</a><a className="text-sm text-deep-foreground/75 hover:text-deep-foreground" href="#faq">FAQ</a><PrimaryLink className="min-h-10 px-4 py-2">Marcar diagnóstico</PrimaryLink></nav>
        <button aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center rounded-md border border-deep-foreground/20 md:hidden">{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
      </div>
      {menuOpen && <nav className="section-shell flex flex-col gap-4 border-t border-deep-foreground/10 py-5 md:hidden"><a href="#servicos" onClick={() => setMenuOpen(false)}>Serviços</a><a href="#pacotes" onClick={() => setMenuOpen(false)}>Pacotes</a><a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a><PrimaryLink>Marcar diagnóstico</PrimaryLink></nav>}
    </header>

    <main>
      <section id="inicio" className="relative bg-deep py-16 text-deep-foreground sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_28%,color-mix(in_oklab,var(--sea)_22%,transparent),transparent_36%)]" />
        <div className="section-shell relative grid items-center gap-14 lg:grid-cols-[1.02fr_.98fr]">
          <div className="reveal"><p className="mb-5 inline-flex items-center gap-2 rounded-full border border-deep-foreground/15 bg-deep-foreground/5 px-3 py-1.5 text-xs font-bold text-deep-foreground/80"><MapPin size={14} className="text-coral"/> Sites locais, feitos na Linha de Sintra</p><h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] sm:text-6xl">O seu negócio, fácil de encontrar.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-deep-foreground/75">Sites simples e modernos para pequenos negócios locais que querem mais contactos, sem perder tempo com tecnologia.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><PrimaryLink tone="coral">Marcar diagnóstico gratuito <ArrowRight size={18}/></PrimaryLink><a href="#pacotes" className="inline-flex min-h-12 items-center justify-center rounded-md border border-deep-foreground/25 px-5 py-3 text-sm font-bold text-deep-foreground hover:bg-deep-foreground/10">Ver pacotes</a></div><p className="mt-4 flex items-center gap-2 text-sm text-deep-foreground/60"><ShieldCheck size={16}/> Diagnóstico gratuito, sem compromisso.</p></div>
          <div className="relative mx-auto w-full max-w-xl pb-8 sm:pb-48 reveal">
            <div className="rounded-lg border border-deep-foreground/15 bg-deep-foreground/8 p-3 shadow-2xl backdrop-blur"><div className="mb-3 flex gap-1.5"><i className="size-2.5 rounded-full bg-coral"/><i className="size-2.5 rounded-full bg-deep-foreground/25"/><i className="size-2.5 rounded-full bg-deep-foreground/25"/></div><div className="overflow-hidden rounded-md bg-surface-warm text-foreground"><div className="flex items-center justify-between px-5 py-4"><span className="font-display text-sm font-bold">Café da Vila</span><span className="text-xs text-muted-foreground">Menu · Visitar</span></div><div className="grid min-h-56 place-items-center bg-primary px-8 text-center text-primary-foreground"><div><Coffee className="mx-auto mb-4" size={40}/><p className="font-display text-2xl font-semibold">Feito perto. Servido com gosto.</p><p className="mt-2 text-sm opacity-75">Aberto hoje até às 19h</p></div></div><div className="grid grid-cols-3 gap-2 p-4 text-center text-xs"><span>Menu</span><span>Horários</span><span>Localização</span></div></div></div>
            <div className="absolute -bottom-3 -right-2 w-36 rounded-[1.2rem] border-4 border-deep bg-background p-2 shadow-2xl sm:bottom-0 sm:-right-4"><div className="overflow-hidden rounded-[.75rem] bg-surface-cool text-foreground"><div className="grid min-h-48 place-items-center p-3 text-center"><div><Coffee className="mx-auto text-primary"/><p className="mt-3 font-display text-sm font-bold">Café da Vila</p><p className="mt-2 text-[10px] text-muted-foreground">Menu e horários sempre à mão.</p><span className="mt-3 inline-block rounded bg-primary px-3 py-1.5 text-[9px] font-bold text-primary-foreground">Como chegar</span></div></div></div></div>
          </div>
        </div>
      </section>

      <section aria-label="Tipos de negócio" className="border-b border-border bg-background py-7"><div className="section-shell grid grid-cols-3 gap-5 sm:grid-cols-6">{businessTypes.map(([Icon,label]) => <div key={label} className="flex flex-col items-center gap-2 text-center text-xs font-semibold text-muted-foreground sm:flex-row sm:justify-center"><Icon size={19} className="text-primary"/>{label}</div>)}</div></section>

      <section className="bg-surface-cool py-20 sm:py-28"><div className="section-shell"><SectionHeading kicker="Como funciona" title="Do primeiro olá ao site online." text="Um processo simples, com decisões claras e sem surpresas pelo caminho."/><div className="mt-12 grid gap-5 md:grid-cols-3">{[[MessageCircle,"Marcamos uma conversa","Percebo o negócio, os clientes e aquilo que precisa."],[Laptop,"Eu construo o site","Organizo o conteúdo e crio uma presença clara e profissional."],[Sparkles,"O negócio fica online","Ajudo a publicar e confirmo que tudo funciona como deve ser."]].map(([Icon,title,text],i) => { const I=Icon as typeof MessageCircle; return <article key={title as string} className="relative overflow-hidden rounded-lg border border-border bg-card p-7 shadow-sm"><span className="font-display text-6xl font-bold text-primary/15">0{i+1}</span><I className="mt-8 text-primary" size={28}/><h3 className="mt-4 text-xl font-semibold">{title as string}</h3><p className="mt-3 leading-7 text-muted-foreground">{text as string}</p></article>})}</div></div></section>

      <section className="bg-background py-20 sm:py-28"><div className="section-shell"><SectionHeading kicker="Para quem" title="Feito para quem tem um negócio para gerir." text="Menos tempo a tentar perceber tecnologia. Mais tempo para cuidar dos seus clientes."/><div className="mt-12 grid gap-6 lg:grid-cols-3">{personas.map(({icon:Icon,role,pain,goal}) => <article key={role} className="rounded-lg border border-border bg-card p-7 shadow-sm"><span className="grid size-12 place-items-center rounded-md bg-secondary text-primary"><Icon size={24}/></span><h3 className="mt-6 text-xl font-semibold">{role}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{pain}</p><div className="my-5 h-px bg-border"/><p className="flex gap-2 text-sm font-semibold text-foreground"><Check className="mt-0.5 shrink-0 text-sea" size={18}/>{goal}</p></article>)}</div></div></section>

      <section id="servicos" className="bg-surface-warm py-20 sm:py-28"><div className="section-shell space-y-20"><div className="grid items-center gap-12 lg:grid-cols-2"><div><SectionHeading kicker="Mais visibilidade" title="Apareça quando alguém procura." text="Horários, localização e serviços ficam claros para quem encontra o seu negócio no Google ou nas redes sociais."/><PrimaryLink className="mt-7">Marcar diagnóstico gratuito</PrimaryLink></div><div className="rounded-lg bg-deep p-8 text-deep-foreground shadow-xl"><Search size={34} className="text-coral"/><div className="mt-8 rounded-md bg-background p-5 text-foreground"><p className="text-xs text-muted-foreground">Resultados perto de si</p><p className="mt-3 font-display text-lg font-semibold">O seu negócio local</p><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded bg-secondary px-2 py-1">Aberto hoje</span><span className="rounded bg-secondary px-2 py-1">Como chegar</span><span className="rounded bg-secondary px-2 py-1">Contactar</span></div></div></div></div><div className="grid items-center gap-12 lg:grid-cols-2"><div className="order-2 rounded-lg border border-border bg-card p-8 shadow-sm lg:order-1"><MessageCircle className="text-primary" size={34}/><p className="mt-8 font-display text-2xl font-semibold">“Olá, gostava de marcar.”</p><div className="mt-5 flex items-center gap-3 rounded-md bg-surface-cool p-4"><span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"><CircleUserRound size={20}/></span><div><p className="text-sm font-bold">Novo contacto</p><p className="text-xs text-muted-foreground">Chegou através do seu site</p></div></div></div><div className="order-1 lg:order-2"><SectionHeading kicker="Mais contactos" title="Transforme visitas em conversas." text="Dê aos clientes caminhos diretos para pedir informações, marcar ou simplesmente saber onde fica."/></div></div></div></section>

      <section className="bg-background py-20 sm:py-28"><div className="section-shell"><SectionHeading kicker="Tudo o que precisa" title="Pequenos detalhes. Grandes diferenças."/><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{extras.map(([Icon,title,text]) => <article key={title} className="rounded-lg border border-border bg-card p-6"><Icon className="text-primary" size={24}/><h3 className="mt-5 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div><div className="mt-10 flex justify-center"><PrimaryLink>Marcar diagnóstico gratuito <ArrowRight size={18}/></PrimaryLink></div></div></section>

      <section className="bg-surface-cool py-20 sm:py-28"><div className="section-shell grid gap-12 lg:grid-cols-[1.2fr_.8fr]"><div><SectionHeading kicker="Porquê a Linha Digital" title="Proximidade sem conversa complicada."/><div className="mt-10 grid gap-4 sm:grid-cols-2">{[["Preço claro","Sabe o que está incluído antes de avançar."],["Pessoa real","Fala diretamente com quem faz o trabalho."],["Sem jargão","Cada decisão é explicada de forma simples."],["Respostas rápidas","Não fica perdido entre departamentos."]].map(([title,text]) => <div key={title} className="border-l-2 border-coral pl-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></div><aside className="rounded-lg bg-deep p-8 text-deep-foreground"><div className="grid size-14 place-items-center rounded-md bg-coral text-coral-foreground"><CircleUserRound size={28}/></div><p className="mt-8 text-xs font-bold uppercase tracking-widest text-coral">Sobre mim</p><h3 className="mt-3 text-2xl font-semibold">Olá, sou o Daniel 👋</h3><p className="mt-4 leading-7 text-deep-foreground/75">Sou estudante de desenvolvimento de software e vivo na Linha de Sintra. Criei a Linha Digital para ajudar negócios locais a ter sites simples, claros e úteis.</p></aside></div></section>

      <section id="pacotes" className="bg-background py-20 sm:py-28"><div className="section-shell"><SectionHeading kicker="Pacotes" title="Escolha um ponto de partida." text="Sem orçamentos misteriosos. Primeiro percebemos o que precisa; depois recebe uma proposta clara."/><div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">{packages.map((pkg) => <article key={pkg.name} className={`relative flex flex-col rounded-lg border p-7 shadow-sm ${pkg.featured ? "border-primary bg-primary text-primary-foreground shadow-xl" : "border-border bg-card"}`}>{pkg.featured && <span className="absolute -top-3 right-5 rounded-full bg-coral px-3 py-1 text-xs font-bold text-coral-foreground">Mais escolhido</span>}<p className={`text-sm font-bold ${pkg.featured ? "text-primary-foreground/70" : "text-primary"}`}>{pkg.name}</p><h3 className="mt-2 text-2xl font-semibold">{pkg.subtitle}</h3><p className={`mt-6 text-2xl font-bold ${pkg.featured ? "text-primary-foreground" : "text-foreground"}`}>Sob consulta{pkg.monthly && <span className="text-sm font-normal">/mês</span>}</p><ul className="mt-7 flex-1 space-y-4">{pkg.items.map(item => <li key={item} className={`flex gap-3 text-sm leading-6 ${pkg.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}><Check className={`mt-0.5 shrink-0 ${pkg.featured ? "text-coral" : "text-primary"}`} size={18}/>{item}</li>)}</ul><PrimaryLink className={`mt-8 w-full ${pkg.featured ? "bg-coral text-coral-foreground hover:bg-coral/90" : ""}`}>Pedir proposta <ArrowRight size={17}/></PrimaryLink></article>)}</div></div></section>

      <section id="faq" className="bg-surface-warm py-20 sm:py-28"><div className="section-shell"><div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><SectionHeading kicker="Perguntas frequentes" title="Tudo claro antes de começar." text="Ainda tem uma dúvida? Falamos dela no diagnóstico gratuito."/><PrimaryLink>Marcar diagnóstico</PrimaryLink></div><div className="mt-12 divide-y divide-border border-y border-border">{faqs.map(([q,a]) => <details key={q} className="group py-1"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-semibold"><span>{q}</span><ChevronDown className="shrink-0 text-primary transition group-open:rotate-180" size={20}/></summary><p className="max-w-3xl pb-6 pr-10 text-sm leading-7 text-muted-foreground">{a}</p></details>)}</div></div></section>

      <section id="marcar" className="scroll-mt-16 bg-deep py-20 text-deep-foreground sm:py-28"><div className="section-shell"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><SectionHeading light kicker="Diagnóstico gratuito" title="Vamos falar do seu negócio." text="Escolha uma hora para uma conversa simples de 15 a 20 minutos, sem compromisso."/><p className="flex items-center gap-2 text-sm text-deep-foreground/70"><Clock3 size={18} className="text-coral"/> 15–20 minutos</p></div><div className="mt-10 overflow-hidden rounded-lg bg-background shadow-2xl"><iframe title="Marcar diagnóstico gratuito com Daniel" src="https://cal.com/daniel-alves-qijnqz/15min?embed=true&theme=light" className="h-[720px] w-full border-0" loading="lazy" /></div><p className="mt-6 text-center text-sm text-deep-foreground/70">Prefere email? Escreva para <a className="font-semibold text-deep-foreground underline decoration-coral decoration-2 underline-offset-4" href="mailto:daniel.alves.132203@gmail.com">daniel.alves.132203@gmail.com</a>.</p></div></section>

      <section className="bg-surface-cool py-16"><div className="section-shell flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left"><div><h2 className="text-2xl font-semibold">O seu próximo cliente já está a procurar.</h2><p className="mt-2 text-muted-foreground">Ajude-o a encontrar o seu negócio.</p></div><PrimaryLink>Marcar diagnóstico gratuito <CalendarDays size={18}/></PrimaryLink></div></section>
    </main>

    <ChatWidget />
    <footer className="bg-deep py-12 text-deep-foreground"><div className="section-shell grid gap-10 border-b border-deep-foreground/10 pb-10 md:grid-cols-3"><div><a href="#inicio" className="font-display text-lg font-bold">Linha Digital</a><p className="mt-3 max-w-xs text-sm leading-6 text-deep-foreground/60">Sites simples para negócios locais da Linha de Sintra.</p></div><div><p className="text-sm font-bold">Explorar</p><div className="mt-4 flex flex-col gap-3 text-sm text-deep-foreground/60"><a href="#servicos">Serviços</a><a href="#pacotes">Pacotes</a><a href="#faq">FAQ</a></div></div><div><p className="text-sm font-bold">Contacto</p><a href="mailto:daniel.alves.132203@gmail.com" className="mt-4 inline-flex items-center gap-2 break-all text-sm text-deep-foreground/60 hover:text-deep-foreground"><Mail size={16}/>daniel.alves.132203@gmail.com</a></div></div><div className="section-shell pt-7 text-xs text-deep-foreground/45">© 2026 Linha Digital. Feito perto, para negócios locais.</div></footer>
  </div>;
}
