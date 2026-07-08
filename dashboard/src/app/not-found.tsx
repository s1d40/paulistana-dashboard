import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Página Não Encontrada</h2>
      <p className="text-zinc-500 mb-4">A página que você tentou acessar não existe.</p>
      <Link href="/" className="bg-emerald-500 text-white px-4 py-2 rounded-xl">
        Voltar para o Início
      </Link>
    </div>
  );
}
