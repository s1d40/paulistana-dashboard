import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import OnboardingClient from './components/OnboardingClient';

export default async function OnboardingPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('fb_onboarding_token')?.value;

  if (!token) {
    redirect('/');
  }

  try {
    // Buscar páginas do Facebook que o usuário administra
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${token}`
    );
    const data = await res.json();

    if (data.error) {
      console.error('Erro Graph API:', data.error);
      return (
        <div className="flex h-screen items-center justify-center bg-black text-white p-8">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-red-400 mb-2">Erro de Conexão</h2>
            <p className="text-zinc-400">{data.error.message}</p>
            <a href="/" className="mt-6 inline-block text-indigo-400 hover:text-indigo-300">Voltar ao início</a>
          </div>
        </div>
      );
    }

    const pages = data.data || [];

    return (
      <main className="min-h-screen bg-black text-white p-4 md:p-8">
        <OnboardingClient pages={pages} token={token} />
      </main>
    );
  } catch (err) {
    console.error('Failed to fetch pages:', err);
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Erro ao carregar dados do Facebook.
      </div>
    );
  }
}
