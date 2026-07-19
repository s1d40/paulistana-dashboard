"use client";

import React from 'react';
import { ShoppingCart, DollarSign, Clock, Package } from 'lucide-react';

export default function EcommerceOverview() {
  return (
    <div className="p-8 max-w-7xl mx-auto ecommerce-theme">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-ecommerce-accent">
          Visão Geral da Loja
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Faturamento Card */}
        <div className="bg-ecommerce-card border border-ecommerce-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-ecommerce-muted">Faturamento (Mês)</h3>
            <div className="p-2 bg-ecommerce-accent/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-ecommerce-accent" />
            </div>
          </div>
          <p className="text-3xl font-bold text-ecommerce-text">R$ 12.450,00</p>
          <p className="text-sm text-green-500 mt-2 flex items-center">
            <span className="font-medium">+15%</span>
            <span className="text-ecommerce-muted ml-2">vs último mês</span>
          </p>
        </div>

        {/* Pedidos Pendentes Card */}
        <div className="bg-ecommerce-card border border-ecommerce-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-ecommerce-muted">Pedidos Pendentes</h3>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-ecommerce-text">24</p>
          <p className="text-sm text-ecommerce-muted mt-2">Aguardando pagamento</p>
        </div>

        {/* Pedidos Aprovados Card */}
        <div className="bg-ecommerce-card border border-ecommerce-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-ecommerce-muted">Pedidos Aprovados</h3>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-ecommerce-text">156</p>
          <p className="text-sm text-ecommerce-muted mt-2">Prontos para entrega/acesso</p>
        </div>

        {/* Total Produtos Card */}
        <div className="bg-ecommerce-card border border-ecommerce-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-ecommerce-muted">Produtos Ativos</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-ecommerce-text">12</p>
          <p className="text-sm text-ecommerce-muted mt-2">Em catálogo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Atividade Recente Placeholder */}
        <div className="bg-ecommerce-card border border-ecommerce-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-ecommerce-text mb-4 border-b border-ecommerce-border pb-4">Últimas Vendas</h3>
          <div className="space-y-4">
             <p className="text-sm text-ecommerce-muted">Nenhuma venda recente.</p>
          </div>
        </div>

        {/* Produtos Populares Placeholder */}
        <div className="bg-ecommerce-card border border-ecommerce-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-ecommerce-text mb-4 border-b border-ecommerce-border pb-4">Produtos Populares</h3>
          <div className="space-y-4">
             <p className="text-sm text-ecommerce-muted">Nenhum dado disponível.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
