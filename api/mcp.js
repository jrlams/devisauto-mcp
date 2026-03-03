server.registerResource(...) avec mimeType: "text/html+skybridge"
_meta: { "openai/outputTemplate": "ui://widget/devis.html" } dans la réponse de l'outil

GitHub → api/mcp.js → ✏️ Edit → remplace tout :
javascriptimport { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

// ─── Widget HTML ──────────────────────────────────────────────────
const DEVIS_WIDGET_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: transparent; padding: 12px; }
  .card { background: #fff; border-radius: 16px; padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .logo { font-size: 26px; }
  .app-title { font-size: 17px; font-weight: 700; color: #1a1a1a; }
  .app-sub { font-size: 11px; color: #999; }
  .ref-badge { background: #f0f7ff; border-radius: 8px; padding: 6px 12px;
               font-size: 12px; color: #0066cc; font-weight: 600; margin-bottom: 14px; }
  .section { margin-bottom: 12px; }
  .section-title { font-size: 10px; font-weight: 700; color: #aaa;
                   text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; }
  .row { display: flex; justify-content: space-between; padding: 3px 0;
         font-size: 13px; border-bottom: 1px solid #f5f5f5; }
  .row:last-child { border-bottom: none; }
  .label { color: #777; }
  .value { font-weight: 600; color: #222; }
  .formule { display: inline-block; background: #e8f5e9; color: #2e7d32;
             border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 700; }
  .options { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
  .opt { background: #f5f5f5; border-radius: 20px; padding: 2px 9px;
         font-size: 11px; color: #555; }
  .prix-box { text-align: center; background: linear-gradient(135deg,#667eea,#764ba2);
              border-radius: 12px; padding: 14px; color: #fff; margin-top: 8px; }
  .prix-annuel { font-size: 26px; font-weight: 800; }
  .prix-mensuel { font-size: 13px; opacity: 0.85; margin-top: 2px; }
  .footer { text-align: center; font-size: 10px; color: #bbb; margin-top: 10px; }
  @media (prefers-color-scheme: dark) {
    .card { background: #1e1e2e; }
    .app-title, .value { color: #eee; }
    .row { border-bottom-color: #2a2a3a; }
    .ref-badge { background: #1a2a4a; }
    .opt { background: #2a2a3a; color: #ccc; }
  }
</style>
</head>
<body>
<div class="card" id="card">
  <div class="header">
    <div class="logo">🚗</div>
    <div><div class="app-title">DevisAuto</div><div class="app-sub">Devis assurance automobile</div></div>
  </div>
  <div class="ref-badge" id="ref">Chargement...</div>

  <div class="section">
    <div class="section-title">🚗 Véhicule</div>
    <div class="row"><span class="label">Véhicule</span><span class="value" id="vehicule">—</span></div>
    <div class="row"><span class="label">Carburant</span><span class="value" id="carburant">—</span></div>
    <div class="row"><span class="label">Valeur</span><span class="value" id="valeur">—</span></div>
  </div>

  <div class="section">
    <div class="section-title">👤 Conducteur</div>
    <div class="row"><span class="label">Né(e) le</span><span class="value" id="naissance">—</span></div>
    <div class="row"><span class="label">Permis</span><span class="value" id="permis">—</span></div>
    <div class="row"><span class="label">Bonus-malus</span><span class="value" id="bonus">—</span></div>
    <div class="row"><span class="label">Usage</span><span class="value" id="usage">—</span></div>
  </div>

  <div class="section">
    <div class="section-title">🛡️ Formule</div>
    <div><span class="formule" id="formule">—</span></div>
    <div class="options" id="options"></div>
  </div>

  <div class="prix-box">
    <div class="prix-annuel" id="annuel">—</div>
    <div class="prix-mensuel" id="mensuel">—</div>
  </div>
  <div class="footer">Devis valable 30 jours · Non contractuel</div>
</div>

<script>
function render(data) {
  if (!data) return;
  const d = data.toolOutput || data;
  document.getElementById("ref").textContent     = "📌 Réf. " + (d.ref||"") + " · " + (d.date||"");
  document.getElementById("vehicule").textContent = (d.marque||"") + " " + (d.modele||"") + " " + (d.annee||"");
  document.getElementById("carburant").textContent = d.carburant||"";
  document.getElementById("valeur").textContent   = (d.valeur||"") + " €";
  document.getElementById("naissance").textContent = d.naissance||"";
  document.getElementById("permis").textContent   = d.permis||"";
  document.getElementById("bonus").textContent    = d.bonus + " " + (d.bonus <= 0.8 ? "🏆" : d.bonus <= 1 ? "✅" : "⚠️");
  document.getElementById("usage").textContent    = d.usage||"";
  document.getElementById("formule").textContent  = d.formule||"";
  document.getElementById("annuel").textContent   = (d.annuel||0) + " €/an";
  document.getElementById("mensuel").textContent  = "soit " + (d.mensuel||0) + " €/mois";
  const optEl = document.getElementById("options");
  optEl.innerHTML = "";
  (d.options||[]).forEach(o => {
    const s = document.createElement("span");
    s.className = "opt"; s.textContent = "✅ " + o;
    optEl.appendChild(s);
  });
}

// MCP Apps bridge (postMessage JSON-RPC)
window.addEventListener("message", (e) => {
  try {
    const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
    if (msg?.method === "ui/notifications/tool-result") {
      render(msg.params);
    }
  } catch (_) {}
});

// window.openai legacy
if (window.openai?.toolOutput) render({ toolOutput: window.openai.toolOutput });
window.addEventListener("openai:set_globals", (e) => {
  if (e.detail?.globals?.toolOutput) render({ toolOutput: e.detail.globals.toolOutput });
});
</script>
</body>
</html>`;

// ─── Serveur MCP ──────────────────────────────────────────────────
function createServer() {
  const server = new McpServer({ name: "DevisAuto", version: "1.0.0" });

  // Enregistrement du widget comme ressource MCP
  server.resource(
    "devis-widget",
    "ui://widget/devis.html",
    { mimeType: "text/html+skybridge" },
    async () => ({
      contents: [{
        uri: "ui://widget/devis.html",
        mimeType: "text/html+skybridge",
        text: DEVIS_WIDGET_HTML,
        _meta: { "openai/widgetPrefersBorder": true }
      }]
    })
  );

  // OUTIL 1 — Véhicule par immatriculation
  server.tool(
    "devisauto_vehicule_immat",
    "Identifier le véhicule par sa plaque d'immatriculation",
    { immatriculation: z.string().describe("Plaque ex: AB-123-CD") },
    async ({ immatriculation }) => ({
      content: [{
        type: "text",
        text: `🚗 **Véhicule simulé pour ${immatriculation.toUpperCase()}**\n• Renault Clio V · 2021 · Essence · 18 500 €\n\n➡️ Continuez avec devisauto_souscripteur.`
      }]
    })
  );

  // OUTIL 2 — Véhicule manuel
  server.tool(
    "devisauto_vehicule_manuel",
    "Saisir le véhicule manuellement",
    {
      marque:           z.string(),
      modele:           z.string(),
      version:          z.string(),
      annee:            z.number().int(),
      carburant:        z.enum(["Essence","Diesel","Électrique","Hybride","GPL"]),
      valeur_catalogue: z.number()
    },
    async ({ marque, modele, version, annee, carburant, valeur_catalogue }) => ({
      content: [{
        type: "text",
        text: `🚗 **${marque} ${modele}** (${annee}) · ${carburant} · ${valeur_catalogue.toLocaleString("fr-FR")} € ✅\n➡️ Continuez avec devisauto_souscripteur.`
      }]
    })
  );

  // OUTIL 3 — Souscripteur
  server.tool(
    "devisauto_souscripteur",
    "Collecter le profil conducteur",
    {
      date_naissance:        z.string(),
      date_permis:           z.string(),
      bonus_malus:           z.number().min(0.5).max(3.5),
      annees_assurance:      z.number().int().min(0),
      usage:                 z.enum(["Domicile-travail","Usage privé","Professionnel","Tournées"]),
      stationnement:         z.enum(["Garage privé","Parking collectif","Rue"]),
      conducteur_secondaire: z.boolean()
    },
    async ({ date_naissance, date_permis, bonus_malus, annees_assurance, usage, stationnement, conducteur_secondaire }) => ({
      content: [{
        type: "text",
        text: `👤 **Profil enregistré** · Bonus : ${bonus_malus} · ${annees_assurance} ans\n➡️ Continuez avec devisauto_sinistralite.`
      }]
    })
  );

  // OUTIL 4 — Sinistralité
  server.tool(
    "devisauto_sinistralite",
    "Historique de sinistres 3 ans",
    {
      nb_responsable:     z.number().int().min(0),
      nb_non_responsable: z.number().int().min(0),
      nb_bris_glace:      z.number().int().min(0),
      nb_vol_incendie:    z.number().int().min(0),
      retrait_permis:     z.boolean(),
      alcool_drogue:      z.boolean()
    },
    async ({ nb_responsable }) => ({
      content: [{
        type: "text",
        text: `📋 **Sinistralité** · ${nb_responsable} responsable(s)\n➡️ Continuez avec devisauto_formules.`
      }]
    })
  );

  // OUTIL 5 — Formules
  server.tool(
    "devisauto_formules",
    "Afficher les 4 formules avec tarifs",
    {
      bonus_malus:              z.number(),
      valeur_vehicule:          z.number(),
      annee_vehicule:           z.number().int(),
      nb_sinistres_responsable: z.number().int().default(0)
    },
    async ({ bonus_malus, valeur_vehicule, annee_vehicule, nb_sinistres_responsable }) => {
      const maj  = nb_sinistres_responsable >= 2 ? 1.35 : nb_sinistres_responsable === 1 ? 1.15 : 1.0;
      const base = valeur_vehicule * 0.04 * bonus_malus * maj;
      const rc   = Math.round(base * 0.50);
      const t    = Math.round(base * 0.75);
      const tp   = Math.round(base * 0.90);
      const tr   = Math.round(base * 1.20);
      return {
        content: [{
          type: "text",
          text: `🛡️ **Formules DevisAuto**\n\n1️⃣ RC seule — ${rc}€/an (${Math.round(rc/12)}€/mois)\n2️⃣ Tiers — ${t}€/an (${Math.round(t/12)}€/mois)\n3️⃣ Tiers Plus — ${tp}€/an (${Math.round(tp/12)}€/mois)\n4️⃣ Tous Risques ⭐ — ${tr}€/an (${Math.round(tr/12)}€/mois)\n\n➡️ Appelez devisauto_devis_final avec la formule choisie.`
        }]
      };
    }
  );

  // OUTIL 6 — Devis final AVEC WIDGET UI
  server.tool(
    "devisauto_devis_final",
    "Générer le devis final avec carte visuelle dans ChatGPT",
    {
      marque:                z.string(),
      modele:                z.string(),
      annee:                 z.number().int(),
      carburant:             z.string(),
      valeur_catalogue:      z.number(),
      date_naissance:        z.string(),
      date_permis:           z.string(),
      bonus_malus:           z.number(),
      usage:                 z.string(),
      nb_sinistres:          z.number().int().default(0),
      formule:               z.enum(["Responsabilité Civile","Tiers","Tiers Plus","Tous Risques"]),
      protection_conducteur: z.boolean().default(false),
      assistance_0km:        z.boolean().default(false),
      vehicule_remplacement: z.boolean().default(false)
    },
    async ({ marque, modele, annee, carburant, valeur_catalogue, date_naissance,
             date_permis, bonus_malus, usage, nb_sinistres, formule,
             protection_conducteur, assistance_0km, vehicule_remplacement }) => {

      const taux = { "Responsabilité Civile": 0.02, "Tiers": 0.03, "Tiers Plus": 0.036, "Tous Risques": 0.048 }[formule];
      const maj  = nb_sinistres >= 2 ? 1.35 : nb_sinistres === 1 ? 1.15 : 1.0;
      let prime  = valeur_catalogue * taux * bonus_malus * maj;

      const options = [];
      if (protection_conducteur) { prime += 45; options.push("Protection conducteur +45€"); }
      if (assistance_0km)        { prime += 35; options.push("Assistance 0km +35€"); }
      if (vehicule_remplacement) { prime += 60; options.push("Véhicule remplacement +60€"); }

      const annuel  = Math.round(prime);
      const mensuel = Math.round(prime / 12);
      const ref     = `DA-${Date.now().toString().slice(-8)}`;
      const date    = new Date().toLocaleDateString("fr-FR");

      // Données envoyées au widget via toolOutput
      const widgetData = {
        ref, date, marque, modele, annee, carburant,
        valeur: valeur_catalogue.toLocaleString("fr-FR"),
        naissance: date_naissance, permis: date_permis,
        bonus: bonus_malus, usage, formule, options, annuel, mensuel
      };

      return {
        content: [{
          type: "text",
          text: `✅ **Devis ${ref}** — ${marque} ${modele} ${annee} · ${formule}\n💶 **${annuel} €/an** (${mensuel} €/mois) · Valable 30 jours`
        }],
        structuredContent: widgetData,
        _meta: {
          "openai/outputTemplate": "ui://widget/devis.html",
          "openai/widgetCSP": {
            "connect_domains": [],
            "resource_domains": []
          }
        }
      };
    }
  );

  return server;
}

// ─── Handler HTTP ─────────────────────────────────────────────────
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
