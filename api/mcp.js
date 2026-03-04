import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
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
  '.ref-badge { background: #f0f7ff; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #0066cc; font-weight: 600; margin-bottom: 14px; }',
  '.section { margin-bottom: 12px; }',
  '.section-title { font-size: 10px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; }',
  '.row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; border-bottom: 1px solid #f5f5f5; }',
  '.row:last-child { border-bottom: none; }',
  '.lbl { color: #777; } .val { font-weight: 600; color: #222; }',
  '.formule { display: inline-block; background: #e8f5e9; color: #2e7d32; border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 700; }',
  '.options { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }',
  '.opt { background: #f5f5f5; border-radius: 20px; padding: 2px 9px; font-size: 11px; color: #555; }',
  '.prix-box { text-align: center; background: linear-gradient(135deg,#667eea,#764ba2); border-radius: 12px; padding: 14px; color: #fff; margin-top: 10px; }',
  '.prix-annuel { font-size: 28px; font-weight: 800; }',
  '.prix-mensuel { font-size: 13px; opacity: 0.85; margin-top: 2px; }',
  '.footer { text-align: center; font-size: 10px; color: #bbb; margin-top: 10px; }',
  '</style></head><body>',
  '<div class="card">',
  '<div class="header"><div class="logo">&#128663;</div>',
  '<div><div class="app-title">DevisAuto</div><div class="app-sub">Devis assurance automobile</div></div></div>',
  '<div class="ref-badge" id="ref">Chargement...</div>',
  '<div class="section"><div class="section-title">&#128663; Vehicule</div>',
  '<div class="row"><span class="lbl">Vehicule</span><span class="val" id="vehicule">-</span></div>',
  '<div class="row"><span class="lbl">Carburant</span><span class="val" id="carburant">-</span></div>',
  '<div class="row"><span class="lbl">Valeur</span><span class="val" id="valeur">-</span></div></div>',
  '<div class="section"><div class="section-title">&#128100; Conducteur</div>',
  '<div class="row"><span class="lbl">Ne(e) le</span><span class="val" id="naissance">-</span></div>',
  '<div class="row"><span class="lbl">Permis</span><span class="val" id="permis">-</span></div>',
  '<div class="row"><span class="lbl">Bonus-malus</span><span class="val" id="bonus">-</span></div>',
  '<div class="row"><span class="lbl">Usage</span><span class="val" id="usage">-</span></div></div>',
  '<div class="section"><div class="section-title">&#128737; Formule</div>',
  '<div><span class="formule" id="formule">-</span></div>',
  '<div class="options" id="options"></div></div>',
  '<div class="prix-box">',
  '<div class="prix-annuel" id="annuel">-</div>',
  '<div class="prix-mensuel" id="mensuel">-</div></div>',
  '<div class="footer">Devis valable 30 jours - Non contractuel</div>',
  '</div>',
  '<script>',
  'function render(d) {',
  '  if (!d) return;',
  '  document.getElementById("ref").textContent = "Ref. "+(d.ref||"")+" - "+(d.date||"");',
  '  document.getElementById("vehicule").textContent = (d.marque||"")+" "+(d.modele||"")+" "+(d.annee||"");',
  '  document.getElementById("carburant").textContent = d.carburant||"";',
  '  document.getElementById("valeur").textContent = (d.valeur||"")+" EUR";',
  '  document.getElementById("naissance").textContent = d.naissance||"";',
  '  document.getElementById("permis").textContent = d.permis||"";',
  '  document.getElementById("bonus").textContent = (d.bonus||"");',
  '  document.getElementById("usage").textContent = d.usage||"";',
  '  document.getElementById("formule").textContent = d.formule||"";',
  '  document.getElementById("annuel").textContent = (d.annuel||0)+" EUR/an";',
  '  document.getElementById("mensuel").textContent = "soit "+(d.mensuel||0)+" EUR/mois";',
  '  var optEl = document.getElementById("options");',
  '  optEl.innerHTML = "";',
  '  var opts = d.options||[];',
  '  for (var i=0; i<opts.length; i++) {',
  '    var s = document.createElement("span");',
  '    s.className = "opt"; s.textContent = opts[i]; optEl.appendChild(s);',
  '  }',
  '}',
  'window.addEventListener("message", function(e) {',
  '  try {',
  '    var m = typeof e.data==="string" ? JSON.parse(e.data) : e.data;',
  '    if (m && m.method==="ui/notifications/tool-result") render(m.params&&(m.params.toolOutput||m.params));',
  '  } catch(x) {}',
  '});',
  'try {',
  '  if (window.openai && window.openai.toolOutput) render(window.openai.toolOutput);',
  '  window.addEventListener("openai:set_globals", function(e) {',
  '    if (e.detail&&e.detail.globals&&e.detail.globals.toolOutput) render(e.detail.globals.toolOutput);',
  '  });',
  '} catch(x) {}',
  '<\/script></body></html>'
].join("\n");

function createServer() {
  const server = new McpServer({ name: "DevisAuto", version: "1.0.0" });

  server.resource(
    "devis-widget",
    "ui://widget/devis.html",
    async () => ({
      contents: [{
        uri: "ui://widget/devis.html",
        mimeType: "text/html+skybridge",
        text: WIDGET_HTML
      }]
    })
  );

  server.tool(
    "devisauto_vehicule_immat",
    "Identifier le vehicule par plaque immatriculation",
    { immatriculation: z.string() },
    async ({ immatriculation }) => ({
      content: [{ type: "text", text: "Vehicule simule pour " + immatriculation.toUpperCase() + "\nRenault Clio V - 2021 - Essence - 18500 EUR\nContinuez avec devisauto_souscripteur." }]
    })
  );

  server.tool(
    "devisauto_vehicule_manuel",
    "Saisir le vehicule manuellement",
    {
      marque: z.string(), modele: z.string(), version: z.string(),
      annee: z.number().int(),
      carburant: z.enum(["Essence","Diesel","Electrique","Hybride","GPL"]),
      valeur_catalogue: z.number()
    },
    async ({ marque, modele, annee, carburant, valeur_catalogue }) => ({
      content: [{ type: "text", text: marque + " " + modele + " (" + annee + ") - " + carburant + " - " + valeur_catalogue + " EUR\nContinuez avec devisauto_souscripteur." }]
    })
  );

  server.tool(
    "devisauto_souscripteur",
    "Collecter le profil conducteur",
    {
      date_naissance: z.string(), date_permis: z.string(),
      bonus_malus: z.number().min(0.5).max(3.5),
      annees_assurance: z.number().int().min(0),
      usage: z.enum(["Domicile-travail","Usage prive","Professionnel","Tournees"]),
      stationnement: z.enum(["Garage prive","Parking collectif","Rue"]),
      conducteur_secondaire: z.boolean()
    },
    async ({ bonus_malus, annees_assurance, usage }) => ({
      content: [{ type: "text", text: "Profil enregistre - Bonus: " + bonus_malus + " - " + annees_assurance + " ans - " + usage + "\nContinuez avec devisauto_sinistralite." }]
    })
  );

  server.tool(
    "devisauto_sinistralite",
    "Historique sinistres 3 ans",
    {
      nb_responsable: z.number().int().min(0),
      nb_non_responsable: z.number().int().min(0),
      nb_bris_glace: z.number().int().min(0),
      nb_vol_incendie: z.number().int().min(0),
      retrait_permis: z.boolean(),
      alcool_drogue: z.boolean()
    },
    async ({ nb_responsable }) => ({
      content: [{ type: "text", text: "Sinistralite: " + nb_responsable + " responsable(s)\nContinuez avec devisauto_formules." }]
    })
  );

  server.tool(
    "devisauto_formules",
    "Afficher les 4 formules avec tarifs",
    {
      bonus_malus: z.number(),
      valeur_vehicule: z.number(),
      annee_vehicule: z.number().int(),
      nb_sinistres_responsable: z.number().int().default(0)
    },
    async ({ bonus_malus, valeur_vehicule, annee_vehicule, nb_sinistres_responsable }) => {
      const maj  = nb_sinistres_responsable >= 2 ? 1.35 : nb_sinistres_responsable === 1 ? 1.15 : 1.0;
      const base = valeur_vehicule * 0.04 * bonus_malus * maj;
      const rc = Math.round(base * 0.50);
      const t  = Math.round(base * 0.75);
      const tp = Math.round(base * 0.90);
      const tr = Math.round(base * 1.20);
      const age = new Date().getFullYear() - annee_vehicule;
      return {
        content: [{ type: "text", text: "Formules DevisAuto (vehicule " + age + " ans)\n\n1. RC seule - " + rc + " EUR/an (" + Math.round(rc/12) + " EUR/mois)\n2. Tiers - " + t + " EUR/an (" + Math.round(t/12) + " EUR/mois)\n3. Tiers Plus - " + tp + " EUR/an (" + Math.round(tp/12) + " EUR/mois)\n4. Tous Risques - " + tr + " EUR/an (" + Math.round(tr/12) + " EUR/mois)\n\nContinuez avec devisauto_devis_final." }]
      };
    }
  );

  server.tool(
    "devisauto_devis_final",
    "Generer le devis final avec carte visuelle",
    {
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
        content: [{ type: "text", text: "Devis " + ref + " - " + marque + " " + modele + " " + annee + " - " + formule + "\n" + annuel + " EUR/an (" + mensuel + " EUR/mois) - Valable 30 jours" }],
        structuredContent: toolOutput,
        _meta: {
          "openai/outputTemplate": "ui://widget/devis.html",
          "openai/widgetCSP": { "connect_domains": [], "resource_domains": [] }
        }
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
