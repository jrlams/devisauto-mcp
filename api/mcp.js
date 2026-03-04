import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

const WIDGET_HTML = [
  '<!DOCTYPE html><html><head><meta charset="utf-8">',
  '<style>',
  '* { box-sizing: border-box; margin: 0; padding: 0; }',
  'body { font-family: -apple-system, sans-serif; background: transparent; padding: 12px; }',
  '.card { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.10); }',
  '.header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }',
  '.logo { font-size: 26px; }',
  '.app-title { font-size: 17px; font-weight: 700; color: #1a1a1a; }',
  '.app-sub { font-size: 11px; color: #999; }',
  '.ref { background: #f0f7ff; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #0066cc; font-weight: 600; margin-bottom: 14px; }',
  '.section { margin-bottom: 12px; }',
  '.stitle { font-size: 10px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; }',
  '.row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; border-bottom: 1px solid #f5f5f5; }',
  '.row:last-child { border-bottom: none; }',
  '.lbl { color: #777; } .val { font-weight: 600; color: #222; }',
  '.badge { display: inline-block; background: #e8f5e9; color: #2e7d32; border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 700; }',
  '.opts { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }',
  '.opt { background: #f5f5f5; border-radius: 20px; padding: 2px 9px; font-size: 11px; color: #555; }',
  '.prix { text-align: center; background: linear-gradient(135deg,#667eea,#764ba2); border-radius: 12px; padding: 14px; color: #fff; margin-top: 10px; }',
  '.p1 { font-size: 28px; font-weight: 800; }',
  '.p2 { font-size: 13px; opacity: 0.85; margin-top: 2px; }',
  '.footer { text-align: center; font-size: 10px; color: #bbb; margin-top: 10px; }',
  '@media (prefers-color-scheme: dark) {',
  '  .card { background: #1e1e2e; } .app-title,.val { color: #eee; }',
  '  .row { border-bottom-color: #2a2a3a; } .ref { background: #1a2a4a; }',
  '  .opt { background: #2a2a3a; color: #ccc; } }',
  '</style></head><body>',
  '<div class="card">',
  '<div class="header"><div class="logo">&#128663;</div>',
  '<div><div class="app-title">DevisAuto</div><div class="app-sub">Devis assurance automobile</div></div></div>',
  '<div class="ref" id="ref">Chargement...</div>',
  '<div class="section"><div class="stitle">Vehicule</div>',
  '<div class="row"><span class="lbl">Vehicule</span><span class="val" id="veh">-</span></div>',
  '<div class="row"><span class="lbl">Carburant</span><span class="val" id="carb">-</span></div>',
  '<div class="row"><span class="lbl">Valeur</span><span class="val" id="val">-</span></div></div>',
  '<div class="section"><div class="stitle">Conducteur</div>',
  '<div class="row"><span class="lbl">Ne le</span><span class="val" id="naiss">-</span></div>',
  '<div class="row"><span class="lbl">Permis</span><span class="val" id="perm">-</span></div>',
  '<div class="row"><span class="lbl">Bonus</span><span class="val" id="bon">-</span></div>',
  '<div class="row"><span class="lbl">Usage</span><span class="val" id="usa">-</span></div></div>',
  '<div class="section"><div class="stitle">Formule</div>',
  '<span class="badge" id="form">-</span>',
  '<div class="opts" id="opts"></div></div>',
  '<div class="prix"><div class="p1" id="ann">-</div><div class="p2" id="men">-</div></div>',
  '<div class="footer">Devis valable 30 jours - Non contractuel</div>',
  '</div>',
  '<script>',
  'function fill(d) {',
  '  if (!d) return;',
  '  document.getElementById("ref").textContent = "Ref. "+(d.ref||"")+" du "+(d.date||"");',
  '  document.getElementById("veh").textContent = (d.marque||"")+" "+(d.modele||"")+" "+(d.annee||"");',
  '  document.getElementById("carb").textContent = d.carburant||"";',
  '  document.getElementById("val").textContent = (d.valeur||"")+" EUR";',
  '  document.getElementById("naiss").textContent = d.naissance||"";',
  '  document.getElementById("perm").textContent = d.permis||"";',
  '  document.getElementById("bon").textContent = String(d.bonus||"");',
  '  document.getElementById("usa").textContent = d.usage||"";',
  '  document.getElementById("form").textContent = d.formule||"";',
  '  document.getElementById("ann").textContent = (d.annuel||0)+" EUR/an";',
  '  document.getElementById("men").textContent = "soit "+(d.mensuel||0)+" EUR/mois";',
  '  var el = document.getElementById("opts"); el.innerHTML = "";',
  '  (d.options||[]).forEach(function(o) { var s=document.createElement("span"); s.className="opt"; s.textContent=o; el.appendChild(s); });',
  '}',
  'window.addEventListener("message", function(e) {',
  '  try { var m = typeof e.data==="string"?JSON.parse(e.data):e.data;',
  '    if (m && m.method==="ui/notifications/tool-result") fill(m.params&&(m.params.toolOutput||m.params));',
  '  } catch(x) {} });',
  'try {',
  '  if (window.openai && window.openai.toolOutput) fill(window.openai.toolOutput);',
  '  window.addEventListener("openai:set_globals", function(e) {',
  '    if (e.detail&&e.detail.globals&&e.detail.globals.toolOutput) fill(e.detail.globals.toolOutput); });',
  '} catch(x) {}',
  '<\/script></body></html>'
].join("\n");

function createServer() {
  const server = new McpServer({ name: "DevisAuto", version: "1.0.0" });

  // Ressource widget avec le bon package ext-apps
  registerAppResource(
    server,
    "devis-widget",
    "ui://widget/devis.html",
    {},
    async () => ({
      contents: [{
        uri: "ui://widget/devis.html",
        mimeType: RESOURCE_MIME_TYPE,
        text: WIDGET_HTML,
        _meta: { "openai/widgetPrefersBorder": true }
      }]
    })
  );

  // Outils classiques (sans widget)
  server.tool("devisauto_vehicule_immat", "Identifier vehicule par plaque",
    { immatriculation: z.string() },
    async ({ immatriculation }) => ({
      content: [{ type: "text", text: "Vehicule simule pour " + immatriculation.toUpperCase() + " : Renault Clio V 2021 Essence 18500 EUR. Continuez avec devisauto_souscripteur." }]
    })
  );

  server.tool("devisauto_vehicule_manuel", "Saisir vehicule manuellement",
    {
      marque: z.string(), modele: z.string(), version: z.string(),
      annee: z.number().int(),
      carburant: z.enum(["Essence","Diesel","Electrique","Hybride","GPL"]),
      valeur_catalogue: z.number()
    },
    async ({ marque, modele, annee, carburant, valeur_catalogue }) => ({
      content: [{ type: "text", text: marque+" "+modele+" ("+annee+") "+carburant+" "+valeur_catalogue+" EUR. Continuez avec devisauto_souscripteur." }]
    })
  );

  server.tool("devisauto_souscripteur", "Profil conducteur",
    {
      date_naissance: z.string(), date_permis: z.string(),
      bonus_malus: z.number().min(0.5).max(3.5),
      annees_assurance: z.number().int().min(0),
      usage: z.enum(["Domicile-travail","Usage prive","Professionnel","Tournees"]),
      stationnement: z.enum(["Garage prive","Parking collectif","Rue"]),
      conducteur_secondaire: z.boolean()
    },
    async ({ bonus_malus, annees_assurance, usage }) => ({
      content: [{ type: "text", text: "Profil: bonus "+bonus_malus+", "+annees_assurance+" ans, "+usage+". Continuez avec devisauto_sinistralite." }]
    })
  );

  server.tool("devisauto_sinistralite", "Historique sinistres",
    {
      nb_responsable: z.number().int().min(0), nb_non_responsable: z.number().int().min(0),
      nb_bris_glace: z.number().int().min(0), nb_vol_incendie: z.number().int().min(0),
      retrait_permis: z.boolean(), alcool_drogue: z.boolean()
    },
    async ({ nb_responsable }) => ({
      content: [{ type: "text", text: nb_responsable+" sinistre(s) responsable. Continuez avec devisauto_formules." }]
    })
  );

  server.tool("devisauto_formules", "4 formules avec tarifs",
    {
      bonus_malus: z.number(), valeur_vehicule: z.number(),
      annee_vehicule: z.number().int(), nb_sinistres_responsable: z.number().int().default(0)
    },
    async ({ bonus_malus, valeur_vehicule, annee_vehicule, nb_sinistres_responsable }) => {
      const maj = nb_sinistres_responsable >= 2 ? 1.35 : nb_sinistres_responsable === 1 ? 1.15 : 1.0;
      const base = valeur_vehicule * 0.04 * bonus_malus * maj;
      const rc = Math.round(base*0.50), t = Math.round(base*0.75),
            tp = Math.round(base*0.90), tr = Math.round(base*1.20);
      return { content: [{ type: "text", text:
        "Formules (vehicule "+(new Date().getFullYear()-annee_vehicule)+" ans):\n"+
        "1. RC - "+rc+" EUR/an\n2. Tiers - "+t+" EUR/an\n"+
        "3. Tiers Plus - "+tp+" EUR/an\n4. Tous Risques - "+tr+" EUR/an\n"+
        "Continuez avec devisauto_devis_final."
      }]};
    }
  );

  // Outil devis final — avec widget via registerAppTool
  registerAppTool(
    server,
    "devisauto_devis_final",
    {
      title: "Generer devis final avec carte visuelle",
      description: "Genere le devis complet avec une carte visuelle dans ChatGPT",
      inputSchema: {
        marque: z.string(), modele: z.string(), annee: z.number().int(),
        carburant: z.string(), valeur_catalogue: z.number(),
        date_naissance: z.string(), date_permis: z.string(),
        bonus_malus: z.number(), usage: z.string(),
        nb_sinistres: z.number().int().default(0),
        formule: z.enum(["Responsabilite Civile","Tiers","Tiers Plus","Tous Risques"]),
        protection_conducteur: z.boolean().default(false),
        assistance_0km: z.boolean().default(false),
        vehicule_remplacement: z.boolean().default(false)
      },
      _meta: { ui: { resourceUri: "ui://widget/devis.html" } }
    },
    async ({ marque, modele, annee, carburant, valeur_catalogue,
             date_naissance, date_permis, bonus_malus, usage, nb_sinistres,
             formule, protection_conducteur, assistance_0km, vehicule_remplacement }) => {

      const tauxMap = { "Responsabilite Civile": 0.02, "Tiers": 0.03, "Tiers Plus": 0.036, "Tous Risques": 0.048 };
      const taux = tauxMap[formule] || 0.048;
      const maj  = nb_sinistres >= 2 ? 1.35 : nb_sinistres === 1 ? 1.15 : 1.0;
      let prime  = valeur_catalogue * taux * bonus_malus * maj;

      const options = [];
      if (protection_conducteur) { prime += 45; options.push("Protection conducteur +45 EUR"); }
      if (assistance_0km)        { prime += 35; options.push("Assistance 0km +35 EUR"); }
      if (vehicule_remplacement) { prime += 60; options.push("Vehicule remplacement +60 EUR"); }

      const annuel  = Math.round(prime);
      const mensuel = Math.round(prime / 12);
      const ref     = "DA-" + Date.now().toString().slice(-8);
      const date    = new Date().toLocaleDateString("fr-FR");

      const toolOutput = {
        ref, date, marque, modele, annee, carburant,
        valeur: String(valeur_catalogue),
        naissance: date_naissance, permis: date_permis,
        bonus: bonus_malus, usage, formule, options, annuel, mensuel
      };

      return {
        content: [{ type: "text", text: "Devis "+ref+" - "+marque+" "+modele+" - "+formule+" - "+annuel+" EUR/an ("+mensuel+" EUR/mois)" }],
        structuredContent: toolOutput,
        _meta: {}
      };
    }
  );

  return server;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const server    = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
