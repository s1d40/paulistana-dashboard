'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Layout, AlertTriangle } from 'lucide-react';

import { Suspense } from 'react';

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (err) {
      console.error('Login error:', err);
      alert('Erro ao tentar logar com o Google.');
      setLoading(false);
    }
  };

  return (
    <div className="z-10 w-full max-w-md p-8 space-y-8 bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-orange-500/20 mx-auto relative">
          <Layout className="w-8 h-8 text-white" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-3 h-3 text-orange-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">
          Cocreator <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-600">Studio</span>
        </h1>
        <p className="text-zinc-500 text-sm font-medium">Acesso restrito à equipe interna.</p>
      </div>

      {error === 'unauthorized' && (
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-2xl flex items-center gap-3 text-red-500">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
            Acesso Negado. Sua conta Google não está na whitelist do projeto.
          </p>
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-zinc-200 text-black rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 group"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 41.939 C -8.804 40.009 -11.514 38.989 -14.754 38.989 C -19.444 38.989 -23.494 41.689 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
        )}
        <span>Entrar com o Google</span>
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center relative overflow-hidden selection:bg-orange-500/30">
      {/* Background Decorativo Dusk */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full opacity-50" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-900/10 blur-[120px] rounded-full opacity-50" />
      </div>

      <Suspense fallback={<div className="text-white">Carregando...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
