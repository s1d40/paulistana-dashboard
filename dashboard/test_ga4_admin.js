const { google } = require('googleapis');
const credentials = require('./.ga4-credentials.json');

async function main() {
  console.log("Iniciando verificação de acesso ao Google Analytics 4...");
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const analyticsadmin = google.analyticsadmin({
      version: 'v1beta',
      auth: auth,
    });

    const res = await analyticsadmin.accountSummaries.list();
    const summaries = res.data.accountSummaries;

    if (!summaries || summaries.length === 0) {
      console.log("A conta de serviço foi autenticada com SUCESSO na nuvem do Google, MAS ela ainda não tem acesso a nenhuma conta do Google Analytics.");
      console.log("Por favor, garanta que o André adicionou o e-mail 'ga-sa-902@cocreator-dashboard.iam.gserviceaccount.com' com permissão de 'Espectador' (Viewer) no GA4.");
      return;
    }

    console.log("SUCESSO! O André liberou o acesso corretamente.");
    console.log("Contas e Propriedades encontradas:");
    for (const account of summaries) {
      console.log(`\n- Conta: ${account.displayName} (${account.name})`);
      if (account.propertySummaries) {
        for (const property of account.propertySummaries) {
          console.log(`  └─ Propriedade GA4: ${property.displayName} | PROPERTY_ID: ${property.property}`);
        }
      }
    }
  } catch (err) {
    console.error("Erro ao tentar acessar a API do Analytics:", err.message);
  }
}

main();
