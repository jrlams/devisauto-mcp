import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

// ─── UI Widget HTML (Apps SDK OpenAI) ────────────────────────────
function buildDevisWidget(data) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: transparent; padding: 16px; }
  .card { background: #fff; border-radius: 16px; padding: 20px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.10); max-width: 480px; }
  .header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .logo { font-size: 28px; }
  .title { font-size: 18px; font-weight: 700; color: #1a1a1a; }
  .subtitle { font-size: 12px; color: #888; }
  .ref { background: #f0f7ff; border-radius: 8px; padding: 8px 12px;
         font-size: 12px; color: #0066cc; font-weight: 600; margin-bottom: 16px; }
  .section { margin-bottom: 14px; }
  .section-title { font-size: 11px; font-weight: 700; color: #888;
                   text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .row { display: flex; justify-content: space-between; padding: 4px 0;
         border-bottom: 1px solid #f5f5f5; font-size: 13px; }
  .row:last-child { border-bottom: none; }
  .label { color: #666; }
  .value { font-weight: 600; color: #1a1a1a; }
  .formule-badge { display: inline-block; background: #e8f5e9; color: #2e7d32;
                   border-radius: 20px; padding: 4px 12px; font-size: 12px;
                   font-weight: 700; margin-bottom: 14px; }
  .prix { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px; padding: 16px; color: white; margin-top: 4px; }
  .prix-annuel { font-size: 28px; font-weight: 800; }
  .prix-mensuel { font-size: 14px; opacity: 0.85; margin-top: 2px; }
  .options { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .option-tag { background: #f0f0f0; border-radius: 20px; padding: 3px 10px;
                font-size: 11px; color: #555; }
  .valid { text-align: center; font-size: 11px; color: #aaa; margin-top: 12px; }
  @media (prefers-color-scheme: dark) {
    .card { background: #1e1e1e; }
    .title { color: #f0f0f0; }
    .value { color: #f0f0f0; }
    .row { border-bottom-color: #333; }
    .ref { background: #1a2a3a; }
    .option-tag { background: #333; color: #ccc; }
  }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">🚗</div>
    <div>
      <div class="title">DevisAuto</div>
      <div class="subtitle">Devis assurance automobile</div>
    </div>
  </div>

  <div class="ref">📌 Réf. ${data.ref} · ${data.date}</div>

  <div class="section">
    <div class="section-title">🚗 Véhicule</div>
    <div class="row"><span class="label">Véhicule</span><span class="value">${data.marque} ${data.modele} ${data.annee}</span></div>
    <div class="row"><span class="label">Carburant</span><span class="value">${data.carburant}</span></div>
    <div class="row"><span class="label">Valeur</span><span class="value">${data.valeur} €</span></div>
  </div>

  <div class="section">
    <div class="section-title">👤 Conducteur</div>
    <div class="row"><span class="label">Né(e) le</span><span class="value">${data.naissance}</span></div>
    <div class="row"><span class="label">Permis</span><span class="value">${data.permis}</span></div>
    <div class="row"><span class="label">Bonus-malus</span><span class="value">${data.bonus} ${data.bonus <= 0.8 ? "🏆" : data.bonus <= 1 ? "✅" : "⚠️"}</span></div>
    <div class="row"><span class="label">Usage</span><span class="value">${data.usage}</span></div>
  </div>

  <div class="section">
    <div class="section-title">🛡️ Formule choisie</div>
    <div class="formule-badge">${data.formule}</div>
    ${data.options.length > 0 ? `<div class="options">${data.options.map(o => `<span class="option-tag">✅ ${o}</span>`).join("")}</div>` : ""}
  </div>

  <div class="prix">
    <div class="prix-annuel">${data.annuel} €/an</div>
    <div class="prix-mensuel">soit ${data.mensuel} €/mois</div>
  </div>

  <div class="valid">Devis valable 30 jours · Non contractuel</div>
</div>
<script>
  // Ajuster la hauteur de l'iframe automatiquement
  document.addEventListener("DOMContentLoaded", () => {
    const h = document.body.scrollHeight;
    if (window.openai?.requestDisplayMode) {
      window.openai.requestDisplayMode({ mode: "inline" });
    }
  });
</script>
</body>
</html>`;
}

// ─── Serveur MCP ──────────────────────────────────────────────────
function createServer() {
  const server = new McpServer({ name: "DevisAuto", version: "1.0.0" });

  // OUTIL 1 — Véhicule par immatriculation
  server.tool(
    "devisauto_vehicule_immat",
    "Identifier le véhicule par sa plaque d'immatriculation",
    { immatriculation: z.string().describe("Plaque ex: AB-123-CD") },
    async ({ immatriculation }) => ({
      content: [{
        type: "text",
        text: `🚗 **DevisAuto — Identification véhicule**\n\nPlaque : **${immatriculation.toUpperCase()}**\n\n✅ Véhicule simulé :\n• Marque : Renault\n• Modèle : Clio V\n• Version : 1.0 TCe 90ch\n• Année : 2021\n• Carburant : Essence\n• Valeur : 18 500 €\n\n➡️ Continuez avec **devisauto_souscripteur**.`
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
        text: `🚗 **${marque} ${modele}** (${annee}) enregistré ✅\n• Version : ${version}\n• Carburant : ${carburant}\n• Valeur : ${valeur_catalogue.toLocaleString("fr-FR")} €\n\n➡️ Continuez avec **devisauto_souscripteur**.`
      }]
    })
  );

  // OUTIL 3 — Souscripteur
  server.tool(
    "devisauto_souscripteur",
    "Collecter le profil du conducteur",
    {
      date_naissance:        z.string().describe("JJ/MM/AAAA"),
      date_permis:           z.string().describe("JJ/MM/AAAA"),
      bonus_malus:           z.number().min(0.5).max(3.5),
      annees_assurance:      z.number().int().min(0),
      usage:                 z.enum(["Domicile-travail","Usage privé","Professionnel","Tournées"]),
      stationnement:         z.enum(["Garage privé","Parking collectif","Rue"]),
      conducteur_secondaire: z.boolean()
    },
    async ({ date_naissance, date_permis, bonus_malus, annees_assurance, usage, stationnement, conducteur_secondaire }) => {
      const label = bonus_malus <= 0.7 ? "🏆 Excellent" : bonus_malus <= 1.0 ? "✅ Bon" : bonus_malus <= 1.5 ? "⚠️ Standard" : "🔴 Malussé";
      return {
        content: [{
          type: "text",
          text: `👤 **Profil enregistré**\n• Naissance : ${date_naissance} · Permis : ${date_permis}\n• Bonus-malus : **${bonus_malus}** ${label}\n• Ancienneté : ${annees_assurance} ans\n• Usage : ${usage} · Stationnement : ${stationnement}\n• Conducteur secondaire : ${conducteur_secondaire ? "Oui" : "Non"}\n\n➡️ Continuez avec **devisauto_sinistralite**.`
        }]
      };
    }
  );

  // OUTIL 4 — Sinistralité
  server.tool(
    "devisauto_sinistralite",
    "Historique de sinistres sur 3 ans",
    {
      nb_responsable:     z.number().int().min(0),
      nb_non_responsable: z.number().int().min(0),
      nb_bris_glace:      z.number().int().min(0),
      nb_vol_incendie:    z.number().int().min(0),
      retrait_permis:     z.boolean(),
      alcool_drogue:      z.boolean()
    },
    async ({ nb_responsable, nb_non_responsable, nb_bris_glace, nb_vol_incendie, retrait_permis, alcool_drogue }) => {
      const profil = (nb_responsable >= 2 || retrait_permis || alcool_drogue)
        ? "🔴 Profil aggravé (+35%)"
        : nb_responsable === 1 ? "🟡 Légère majoration (+15%)"
        : "🟢 Excellent profil";
      return {
        content: [{
          type: "text",
          text: `📋 **Sinistralité enregistrée**\n• Responsables : ${nb_responsable} · Non-responsables : ${nb_non_responsable}\n• Bris de glace : ${nb_bris_glace} · Vol/Incendie : ${nb_vol_incendie}\n• Retrait permis : ${retrait_permis ? "⚠️ Oui" : "Non"} · Alcool/Drogues : ${alcool_drogue ? "🔴 Oui" : "Non"}\n\n${profil}\n\n➡️ Continuez avec **devisauto_formules**.`
        }]
      };
    }
  );

  // OUTIL 5 — Formules
  server.tool(
    "devisauto_formules",
    "Afficher les 4 formules d'assurance avec tarifs",
    {
      bonus_malus:     z.number(),
      valeur_vehicule: z.number(),
      annee_vehicule:  z.number().int(),
      nb_sinistres_responsable: z.number().int().default(0)
    },
    async ({ bonus_malus, valeur_vehicule, annee_vehicule, nb_sinistres_responsable }) => {
      const majoration = nb_sinistres_responsable >= 2 ? 1.35 : nb_sinistres_responsable === 1 ? 1.15 : 1.0;
      const base = valeur_vehicule * 0.04 * bonus_malus * majoration;
      const rc = Math.round(base * 0.50);
      const t  = Math.round(base * 0.75);
      const tp = Math.round(base * 0.90);
      const tr = Math.round(base * 1.20);
      const age = new Date().getFullYear() - annee_vehicule;
      return {
        content: [{
          type: "text",
          text: `🛡️ **DevisAuto — Formules** (véhicule de ${age} ans)\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n**1️⃣ Responsabilité Civile** — ${rc}€/an (${Math.round(rc/12)}€/mois)\n   Dommages aux tiers uniquement\n\n**2️⃣ Tiers** — ${t}€/an (${Math.round(t/12)}€/mois)\n   + Vol, Incendie, Bris de glace\n\n**3️⃣ Tiers Plus** — ${tp}€/an (${Math.round(tp/12)}€/mois)\n   + Dommages collision (franchise 300€)\n\n**4️⃣ Tous Risques ⭐** — ${tr}€/an (${Math.round(tr/12)}€/mois)\n   Couverture totale\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n➡️ Choisissez et appelez **devisauto_devis_final**.`
        }]
      };
    }
  );

  // OUTIL 6 — Devis final avec UI widget
  server.tool(
    "devisauto_devis_final",
    "Générer le devis final avec carte visuelle",
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
    async ({ marque, modele, annee, carburant, valeur_catalogue, date_naissance, date_permis, bonus_malus, usage, nb_sinistres, formule, protection_conducteur, assistance_0km, vehicule_remplacement }) => {
      const taux = formule === "Responsabilité Civile" ? 0.02
                 : formule === "Tiers"                 ? 0.03
                 : formule === "Tiers Plus"            ? 0.036
                 :                                       0.048;
      const majoration = nb_sinistres >= 2 ? 1.35 : nb_sinistres === 1 ? 1.15 : 1.0;
      let prime = valeur_catalogue * taux * bonus_malus * majoration;
      const options = [];
      if (protection_conducteur) { prime += 45; options.push("Protection conducteur +45€"); }
      if (assistance_0km)        { prime += 35; options.push("Assistance 0km +35€"); }
      if (vehicule_remplacement) { prime += 60; options.push("Véhicule remplacement +60€"); }

      const annuel  = Math.round(prime);
      const mensuel = Math.round(prime / 12);
      const ref     = `DA-${Date.now().toString().slice(-8)}`;
      const date    = new Date().toLocaleDateString("fr-FR");

      const widgetData = {
        ref, date, marque, modele, annee, carburant,
        valeur: valeur_catalogue.toLocaleString("fr-FR"),
        naissance: date_naissance, permis: date_permis,
        bonus: bonus_malus, usage, formule, options, annuel, mensuel
      };

      const html = buildDevisWidget(widgetData);
      const htmlB64 = Buffer.from(html).toString("base64");

      return {
        content: [
          {
            type: "text",
            text: `✅ **Devis ${ref} généré !**\n\n🚗 ${marque} ${modele} ${annee} · ${formule}\n💶 **${annuel} €/an** (${mensuel} €/mois)\n\n_Valable 30 jours · Non contractuel_`
          }
        ],
        _meta: {
          "openai/widget": {
            type: "iframe",
            iframeUrl: `data:text/html;base64,${htmlB64}`,
            height: 520
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
