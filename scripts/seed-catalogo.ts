// Writes the demonstration catalogue to Firestore. Run from the project folder (Bun loads .env):
//   bun scripts/seed-catalogo.ts
// Existing items are left untouched, so manual edits in the Firebase console are never overwritten.
// All prices are fictitious: the business publishes no prices ("Sob consulta").
import { createDocument, type FirestoreValue } from "../src/lib/firestore.server";

const CONDICAO_DEMO = "Preço fictício, apenas para demonstração.";

const ITENS: { [id: string]: { [key: string]: FirestoreValue } } = {
  "site-base": {
    nome: "Site de uma página",
    descricao:
      "Página moderna adaptada a telemóvel, com formulário de contacto, botão de WhatsApp, mapa e horários.",
    unidade: "pacote",
    precoUnitarioCentimos: 35000,
    recorrencia: "unica",
    condicoes: `Até 5 secções. Domínio e alojamento pagos à parte pelo cliente. ${CONDICAO_DEMO}`,
  },
  reformulacao: {
    nome: "Reformulação de site existente",
    descricao:
      "Novo visual para um site desatualizado, com o conteúdo reorganizado e reescrito para ser claro.",
    unidade: "pacote",
    precoUnitarioCentimos: 45000,
    recorrencia: "unica",
    condicoes: `Até 5 secções; páginas extra cobradas como página adicional. ${CONDICAO_DEMO}`,
  },
  "pagina-adicional": {
    nome: "Página adicional",
    descricao:
      "Página extra no site, por exemplo menu, galeria de fotografias ou lista de serviços.",
    unidade: "unidade",
    precoUnitarioCentimos: 7500,
    recorrencia: "unica",
    condicoes: `Por página. Textos e fotografias fornecidos pelo cliente. ${CONDICAO_DEMO}`,
  },
  "perfil-google": {
    nome: "Perfil de Empresa no Google",
    descricao:
      "Criação ou melhoria do Perfil de Empresa no Google (mapa, horários, fotografias, contactos).",
    unidade: "pacote",
    precoUnitarioCentimos: 5000,
    recorrencia: "unica",
    condicoes: `Não garante uma posição específica nos resultados do Google. ${CONDICAO_DEMO}`,
  },
  "manutencao-mensal": {
    nome: "Manutenção mensal",
    descricao:
      "Atualizações de textos e imagens, verificação regular do funcionamento e pequenos ajustes técnicos.",
    unidade: "pacote",
    precoUnitarioCentimos: 3000,
    recorrencia: "mensal",
    condicoes: `Até 3 alterações por mês. Cancelável a qualquer momento. ${CONDICAO_DEMO}`,
  },
};

for (const [id, item] of Object.entries(ITENS)) {
  const result = await createDocument("catalogo", id, {
    ...item,
    moeda: "EUR",
    ativo: true,
    precoFicticio: true,
  });
  console.log(`${id}: ${result === "created" ? "criado" : "já existia, não foi alterado"}`);
}
