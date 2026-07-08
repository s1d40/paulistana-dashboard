'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Layout, UserPlus, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nome.trim()) {
      setError('Digite seu nome.');
      return;
    }
    if (!email.trim()) {
      setError('Digite seu email.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login?registered=true'), 2000);
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center relative overflow-hidden selection:bg-orange-500/30">
      {/* Background Decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full opacity-50" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-900/10 blur-[120px] rounded-full opacity-50" />
      </div>

      <div className="z-10 w-full max-w-md p-8 space-y-6 bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
        {/* Header */}
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
          <p className="text-zinc-500 text-sm font-medium">Crie sua conta para começar.</p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-6 bg-emerald-950/20 border border-emerald-900/50 rounded-2xl flex flex-col items-center gap-3 text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="w-12 h-12" />
            <p className="text-sm font-bold text-center">
              Conta criada com sucesso!<br />
              <span className="text-zinc-400 font-normal">Redirecionando para o login...</span>
            </p>
          </div>
        ) : (
          <>
            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-2xl flex items-center gap-3 text-red-500">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Como deseja ser chamado"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all pr-12"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 block">
                  Confirmar Senha
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-400 hover:to-purple-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-5 h-5" />
                )}
                <span>{loading ? 'Criando conta...' : 'Criar minha conta'}</span>
              </button>
            </form>

            {/* Footer Link */}
            <div className="text-center pt-2">
              <button
                onClick={() => router.push('/login')}
                className="text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-purple-400 transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-3 h-3" />
                Já tem conta? Faça login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
