"use client";

import React, { useState } from 'react';
import { Search, Eye, Filter } from 'lucide-react';

export default function EcommerceOrders() {
  const [searchTerm, setSearchTerm] = useState('');

  // Placeholder data
  const orders = [
    { id: '#1024', customer: 'João Silva', date: '2023-10-27', total: 'R$ 297,00', paymentStatus: 'Aprovado', fulfillmentStatus: 'Entregue' },
    { id: '#1025', customer: 'Maria Oliveira', date: '2023-10-27', total: 'R$ 147,00', paymentStatus: 'Pendente', fulfillmentStatus: 'Aguardando' },
    { id: '#1026', customer: 'Carlos Souza', date: '2023-10-26', total: 'R$ 497,00', paymentStatus: 'Recusado', fulfillmentStatus: 'Cancelado' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto ecommerce-theme">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ecommerce-accent">Pedidos</h1>
          <p className="text-ecommerce-muted mt-1">Acompanhe as vendas e o status de pagamento.</p>
        </div>
      </div>

      <div className="bg-ecommerce-card border border-ecommerce-border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-ecommerce-border flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ecommerce-muted" />
            <input
              type="text"
              placeholder="Buscar cliente ou pedido..."
              className="w-full bg-ecommerce-bg border border-ecommerce-border rounded-lg pl-9 pr-4 py-2 text-sm text-ecommerce-text focus:outline-none focus:border-ecommerce-accent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <button className="flex items-center text-sm font-medium text-ecommerce-muted bg-ecommerce-bg border border-ecommerce-border rounded-lg px-4 py-2 hover:bg-ecommerce-bg/80 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ecommerce-bg/50 border-b border-ecommerce-border text-ecommerce-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Pedido</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Pagamento</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ecommerce-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-ecommerce-bg/30 transition-colors text-ecommerce-text">
                  <td className="px-6 py-4 font-medium text-ecommerce-accent">{order.id}</td>
                  <td className="px-6 py-4">{order.date}</td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4 font-medium">{order.total}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.paymentStatus === 'Aprovado' ? 'bg-green-500/10 text-green-500' :
                      order.paymentStatus === 'Pendente' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-800/50 text-zinc-300">
                      {order.fulfillmentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-ecommerce-muted hover:text-ecommerce-accent p-1 transition-colors">
                      <Eye className="w-4 h-4" />
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
