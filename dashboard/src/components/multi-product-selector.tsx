'use client';

import { useState } from 'react';
import { Product } from '@/services/google-sheets';
import { Package, ChevronDown, CheckCircle2, Search, X } from 'lucide-react';
import clsx from 'clsx';

interface MultiProductSelectorProps {
  products: Product[];
  selectedProducts: Product[];
  onChange: (products: Product[]) => void;
}

export default function MultiProductSelector({ products, selectedProducts, onChange }: MultiProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.Produto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProduct = (product: Product) => {
    const isSelected = selectedProducts.some(p => p.Produto === product.Produto);
    if (isSelected) {
      onChange(selectedProducts.filter(p => p.Produto !== product.Produto));
    } else {
      onChange([...selectedProducts, product]);
    }
  };

  const removeProduct = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    onChange(selectedProducts.filter(p => p.Produto !== product.Produto));
  };

  return (
    <div className="relative w-full mt-2">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-indigo-500 transition-all shadow-sm group cursor-pointer"
      >
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <div className="p-2 bg-zinc-900 rounded-lg text-indigo-500 shadow-sm shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="text-left flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            {selectedProducts.length === 0 ? (
              <p className="text-[10px] font-bold text-zinc-400 truncate uppercase tracking-widest">
                Selecionar Produtos...
              </p>
            ) : (
              selectedProducts.map((p) => (
                <span key={p.Produto} className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-md text-[9px] font-bold">
                  <span className="truncate max-w-[100px]">{p.Produto}</span>
                  <button onClick={(e) => removeProduct(e, p)} className="hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
        <ChevronDown className={clsx("w-4 h-4 text-zinc-500 transition-transform shrink-0 ml-2", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-2 border-b border-zinc-800 flex items-center gap-2">
               <Search className="w-3.5 h-3.5 text-zinc-500 ml-2" />
               <input 
                 type="text" 
                 placeholder="Pesquisar produto..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-transparent border-none outline-none text-xs p-2 text-white placeholder:text-zinc-600 font-medium"
                 autoFocus
               />
            </div>
            <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500 italic">
                  Nenhum produto encontrado.
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedProducts.some(p => p.Produto === product.Produto);
                  return (
                    <button
                      key={product.Produto}
                      onClick={() => toggleProduct(product)}
                      className={clsx(
                        "w-full flex items-center justify-between p-3 rounded-lg transition-colors mb-1 last:mb-0",
                        isSelected
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "hover:bg-zinc-800 text-zinc-300"
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden text-left">
                        <div className="p-1.5 bg-zinc-950 rounded text-zinc-500 shrink-0">
                          <Package className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold truncate">{product.Produto}</p>
                          <p className="text-[8px] font-mono opacity-60 truncate">{product.slug_imagem_real}</p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
