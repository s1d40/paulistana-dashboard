// Script leve executado pelo PM2 via Cron no servidor.
// Ele faz um POST para o Dashboard para executar a lógica complexa de sincronização.

async function triggerSync() {
  console.log("==========================================");
  console.log("🕒 [Cron PM2] Acordando o Painel para Sincronização Diária...");
  console.log("==========================================");
  
  try {
    // 1. Auto-Descobrir Novos Concorrentes (Top 25)
    console.log("🔍 Passo 1: Procurando os Top 25 concorrentes no Mercado Livre...");
    const resDiscover = await fetch('https://painel.paulistanaemporio.com/api/concorrencia/auto-discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!resDiscover.ok) {
      console.error("❌ Falha no Auto-Discover:", resDiscover.status);
    } else {
      const dataDiscover = await resDiscover.json();
      console.log("✅ Auto-Discover Concluído:", dataDiscover.summary?.length, "produtos processados.");
    }

    // 2. Atualizar Preços de Todos os Rastreados Existentes
    console.log("🔄 Passo 2: Sincronizando preços de todos os anúncios vigiados...");
    const resSync = await fetch('https://painel.paulistanaemporio.com/api/concorrencia/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!resSync.ok) {
      console.error("❌ Falha na Sincronização:", resSync.status);
    } else {
      const dataSync = await resSync.json();
      console.log("✅ Sincronização Concluída. Total atualizados:", dataSync.synced);
    }

    console.log("🎯 Rotina diária finalizada com sucesso!");
  } catch (err) {
    console.error("❌ Erro fatal de rede ao acionar cron:", err);
    process.exit(1);
  }
}

triggerSync();
