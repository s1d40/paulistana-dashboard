'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-bold mb-4">Ocorreu um erro inesperado!</h2>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-emerald-500 text-white rounded-xl"
      >
        Tentar Novamente
      </button>
    </div>
  );
}
