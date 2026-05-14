'use client';

import { useState } from 'react';
import { Product } from '@/services/google-sheets';
import { Package, ChevronDown, CheckCircle2, Search } from 'lucide-react';
import clsx from 'clsx';

interface ProductSelectorProps {
  products: Product[];
  onSelect: (product: Product) => void;
}

export default function ProductSelector({ products, onSelect }: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.Produto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (product: Product) => {
    setSelectedProductId(product.Produto);
    onSelect(product);
    setIsOpen(false);
  };

  const selectedProduct = products.find(p => p.Produto === selectedProductId);

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 transition-all shadow-sm group"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-indigo-500 shadow-sm shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
              {selectedProduct ? selectedProduct.Produto : 'Selecionar Produto do Catálogo'}
            </p>
            {selectedProduct && (
               <p className="text-[8px] font-mono text-zinc-500 truncate">{selectedProduct.slug_imagem_real}</p>
            )}
          </div>
        </div>
        <ChevronDown className={clsx("w-4 h-4 text-zinc-400 transition-transform shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
               <Search className="w-3.5 h-3.5 text-zinc-400 ml-2" />
               <input 
                 type="text" 
                 placeholder="Pesquisar produto..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-transparent border-none outline-none text-xs p-2 dark:text-white"
                 autoFocus
               />
            </div>
            <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500 italic">
                  Nenhum produto encontrado.
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.Produto}
                    onClick={() => handleSelect(product)}
                    className={clsx(
                      "w-full flex items-center justify-between p-3 rounded-lg transition-colors mb-1 last:mb-0",
                      selectedProductId === product.Produto
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden text-left">
                      <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500 shrink-0">
                        <Package className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold truncate">{product.Produto}</p>
                        <p className="text-[8px] font-mono opacity-60 truncate">{product.slug_imagem_real}</p>
                      </div>
                    </div>
                    {selectedProductId === product.Produto && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-2" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
