"use client";

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export default function EcommerceProducts() {
  const [searchTerm, setSearchTerm] = useState('');

  // Placeholder data
  const products = [
    { id: 1, name: 'Mapa Astral Natal Completo', price: 'R$ 297,00', type: 'Digital', status: 'Ativo' },
    { id: 2, name: 'Guia dos Trânsitos 2024', price: 'R$ 147,00', type: 'Digital', status: 'Ativo' },
    { id: 3, name: 'Consulta Sinastria Amorosa', price: 'R$ 497,00', type: 'Serviço', status: 'Inativo' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto ecommerce-theme">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ecommerce-accent">Produtos</h1>
          <p className="text-ecommerce-muted mt-1">Gerencie seu catálogo de produtos e serviços.</p>
        </div>
        <button className="bg-ecommerce-accent hover:opacity-90 text-ecommerce-bg font-medium px-4 py-2 rounded-lg flex items-center transition-opacity">
          <Plus className="w-5 h-5 mr-2" />
          Novo Produto
        </button>
      </div>

      <div className="bg-ecommerce-card border border-ecommerce-border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-ecommerce-border flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ecommerce-muted" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="w-full bg-ecommerce-bg border border-ecommerce-border rounded-lg pl-9 pr-4 py-2 text-sm text-ecommerce-text focus:outline-none focus:border-ecommerce-accent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
             <select className="bg-ecommerce-bg border border-ecommerce-border rounded-lg px-3 py-2 text-sm text-ecommerce-text focus:outline-none">
               <option>Todos os Tipos</option>
               <option>Digital</option>
               <option>Físico</option>
               <option>Serviço</option>
             </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ecommerce-bg/50 border-b border-ecommerce-border text-ecommerce-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Nome do Produto</th>
                <th className="px-6 py-3 font-medium">Preço</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ecommerce-border">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-ecommerce-bg/30 transition-colors text-ecommerce-text">
                  <td className="px-6 py-4 font-medium">{product.name}</td>
                  <td className="px-6 py-4">{product.price}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-800/50 text-zinc-300">
                      {product.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      product.status === 'Ativo' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-ecommerce-muted hover:text-ecommerce-accent p-1 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-ecommerce-muted hover:text-red-500 p-1 ml-2 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
