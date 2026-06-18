"use client";

import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Package,
  Calendar as CalendarIcon,
  Download,
  Filter,
  Minus
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const mockSalesData = [
  { date: '01 Jun', revenue: 4500, orders: 120 },
  { date: '02 Jun', revenue: 5200, orders: 140 },
  { date: '03 Jun', revenue: 4800, orders: 130 },
  { date: '04 Jun', revenue: 6100, orders: 160 },
  { date: '05 Jun', revenue: 5900, orders: 155 },
  { date: '06 Jun', revenue: 7200, orders: 190 },
  { date: '07 Jun', revenue: 8500, orders: 210 },
  { date: '08 Jun', revenue: 7800, orders: 195 },
  { date: '09 Jun', revenue: 9200, orders: 230 },
  { date: '10 Jun', revenue: 11500, orders: 280 },
];

const mockTopProducts = [
  { id: 1, name: 'Mix De Vegetais Desidratados 1kg', sales: 450, revenue: 15750, trend: 'up', stock: 120 },
  { id: 2, name: 'Castanha de Caju W1 Premium 500g', sales: 320, revenue: 25600, trend: 'up', stock: 45 },
  { id: 3, name: 'Mix de Frutas Tropicais Chips', sales: 210, revenue: 8400, trend: 'stable', stock: 200 },
  { id: 4, name: 'Amêndoa Crua Chilena 1kg', sales: 150, revenue: 10500, trend: 'down', stock: 10 },
];

export default function EcommercePage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  React.useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/nuvemshop/orders?status=paid');
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
          
          // Calcular Faturamento
          const rev = data.reduce((acc, o) => acc + Number(o.total || 0), 0);
          setTotalRevenue(rev);

          // Agrupar Vendas por Dia
          const salesByDate: Record<string, { revenue: number, orders: number }> = {};
          data.forEach(o => {
            const d = new Date(o.created_at);
            const dateKey = `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}`;
            if (!salesByDate[dateKey]) salesByDate[dateKey] = { revenue: 0, orders: 0 };
            salesByDate[dateKey].revenue += Number(o.total || 0);
            salesByDate[dateKey].orders += 1;
          });
          const salesArray = Object.keys(salesByDate).map(date => ({
            date,
            revenue: salesByDate[date].revenue,
            orders: salesByDate[date].orders
          })).reverse(); // Nuvemshop returns newest first
          setSalesData(salesArray.length > 0 ? salesArray : mockSalesData);

          // Calcular Curva ABC (Top Products)
          const productMap: Record<string, any> = {};
          data.forEach(o => {
            if (o.products) {
              o.products.forEach((p: any) => {
                if (!productMap[p.product_id]) {
                  productMap[p.product_id] = { id: p.product_id, name: p.name, sales: 0, revenue: 0, trend: 'stable', stock: p.stock || 0 };
                }
                productMap[p.product_id].sales += Number(p.quantity);
                productMap[p.product_id].revenue += Number(p.price) * Number(p.quantity);
              });
            }
          });
          const topArr = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
          setTopProducts(topArr.length > 0 ? topArr : mockTopProducts);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [timeRange]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-indigo-500" />
            Inteligência de Vendas
          </h1>
          <p className="text-zinc-400 mt-2">
            Análise de performance, faturamento e curva ABC dos seus produtos no Mercado Livre e Bling.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900/80 p-1 rounded-xl flex items-center border border-zinc-800">
            {['7d', '15d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  timeRange === range 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20 font-medium text-sm">
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-zinc-400 font-medium">Faturamento Total (Nuvemshop)</h3>
          </div>
          <div className="text-4xl font-black text-white mb-2">R$ {totalRevenue > 0 ? totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3 h-3 mr-1" /> --%
            </span>
            <span className="text-zinc-500">vs. período anterior</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingCart className="w-16 h-16 text-indigo-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-zinc-400 font-medium">Pedidos Pagos</h3>
          </div>
          <div className="text-4xl font-black text-white mb-2">{orders.length > 0 ? orders.length : '-'}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +8.1%
            </span>
            <span className="text-zinc-500">vs. período anterior</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-amber-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-zinc-400 font-medium">Ticket Médio</h3>
          </div>
          <div className="text-4xl font-black text-white mb-2">R$ {orders.length > 0 ? (totalRevenue / orders.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center text-rose-400 font-medium bg-rose-400/10 px-2 py-0.5 rounded-md">
              <ArrowDownRight className="w-3 h-3 mr-1" /> --%

            </span>
            <span className="text-zinc-500">vs. período anterior</span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white">Evolução de Receita</h2>
          <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <Filter className="w-4 h-4" /> Filtrar
          </button>
        </div>
        {loading ? (
           <div className="h-[300px] w-full flex items-center justify-center text-zinc-500">Sincronizando com Nuvemshop...</div>
        ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#52525b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `R$${value/1000}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 6, fill: '#6366f1', stroke: '#18181b', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        )}
      </div>

      {/* Top Products Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/80">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            Curva A (Produtos mais vendidos)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800">
                <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Vendas (Qtd)</th>
                <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Faturamento</th>
                <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Estoque Restante</th>
                <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Tendência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {topProducts.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-200 group-hover:text-indigo-400 transition-colors">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-300 font-medium">
                    {product.sales} un
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-400 font-bold">
                    R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                      product.stock < 50 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {product.stock} un
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {product.trend === 'up' && <ArrowUpRight className="w-5 h-5 text-emerald-500 inline-block" />}
                    {product.trend === 'down' && <ArrowDownRight className="w-5 h-5 text-rose-500 inline-block" />}
                    {product.trend === 'stable' && <Minus className="w-5 h-5 text-zinc-500 inline-block" />}
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
