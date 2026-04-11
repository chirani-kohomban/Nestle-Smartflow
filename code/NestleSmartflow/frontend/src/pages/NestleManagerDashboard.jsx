import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, LogOut, BarChart3, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function NestleManagerDashboard() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!token || user?.role !== 'NESTLE_MANAGER') {
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const ordRes = await axios.get(`${API_URL}/orders`, { headers });
      setOrders(ordRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const downloadWeeklyReport = () => {
    if (orders.length === 0) return alert('No orders to download.');
    const headers = ['Order ID', 'Retailer', 'Status', 'Payment Status', 'Date'];
    const rows = orders.map(o => [
      o.id,
      `"${o.retailer_name}"`,
      o.status,
      o.payment_status,
      new Date(o.created_at).toLocaleDateString()
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "weekly_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate chart data explicitly checking items
  const getChartData = () => {
    const dataMap = {};
    orders.forEach(o => {
        if (o.items && Array.isArray(o.items)) {
            o.items.forEach(item => {
                const name = item.product_name || 'Unknown';
                if (!dataMap[name]) dataMap[name] = 0;
                dataMap[name] += parseInt(item.quantity || 0, 10);
            });
        }
    });
    return Object.keys(dataMap).map(key => ({
      name: key,
      quantity: dataMap[key]
    })).sort((a, b) => b.quantity - a.quantity).slice(0, 5); // top 5
  };
  
  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 lg:p-8 relative selection:bg-blue-500/30 selection:text-blue-200">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <TopNavigation user={user} onLogout={logout} onDownload={downloadWeeklyReport} />
      
      <div className="w-full max-w-7xl grid grid-cols-1 gap-8 relative z-10">
        
        {/* Charts Panel */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-8">
           <h2 className="text-xl font-bold mb-6 flex items-center text-white tracking-tight">
            <div className="bg-slate-800 p-2 rounded-xl mr-3 shadow-inner border border-slate-700">
              <BarChart3 className="text-blue-400 w-5 h-5" />
            </div>
            Top Demanded Products
          </h2>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-500">No data available for charts.</div>
            )}
          </div>
        </div>

        {/* Order History Panel */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center text-white tracking-tight">
            <div className="bg-slate-800 p-2 rounded-xl mr-3 shadow-inner border border-slate-700">
              <Clock className="text-slate-300 w-5 h-5" />
            </div>
            Active & Past Orders
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-300 text-xs uppercase tracking-wider font-bold">
                  <th className="p-4 border-b border-slate-800/80">Order Ref</th>
                  <th className="p-4 border-b border-slate-800/80">Destination</th>
                  <th className="p-4 border-b border-slate-800/80 w-1/3">Manifest</th>
                  <th className="p-4 border-b border-slate-800/80">State</th>
                  <th className="p-4 border-b border-slate-800/80">Ledger</th>
                  <th className="p-4 border-b border-slate-800/80 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-slate-500 font-medium">#{o.id}</td>
                    <td className="p-4 font-semibold text-slate-200">{o.retailer_name}</td>
                    <td className="p-4 text-slate-400">
                      <div className="flex flex-wrap gap-1.5">
                        {o.items?.map((i, idx) => (
                          <span key={idx} className="bg-slate-800 text-xs px-2 py-1 rounded-md text-slate-300 border border-slate-700">
                            <strong className="text-blue-400 mr-1">{i.quantity}x</strong>{i.product_name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                        o.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        o.status === 'DISPATCHED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                        o.payment_status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-right tabular-nums">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan="6" className="text-center p-8 text-slate-500 font-medium">No ledger entries found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function TopNavigation({ user, onLogout, onDownload }) {
  return (
    <div className="w-full max-w-7xl flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-900/60 backdrop-blur-md p-4 sm:px-8 rounded-2xl shadow-lg border border-slate-700/50 relative z-10">
      <div className="flex items-center space-x-3 mb-4 sm:mb-0">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-inner">
           <BarChart3 className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight leading-none">Smart<span className="text-blue-500">Flow</span></h1>
          <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mt-1">NESTLE MANAGER PORTAL</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onDownload} className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 rounded-xl text-sm">
          <Download size={16} />
          <span>Weekly Report</span>
        </button>
        <div className="hidden sm:block text-sm font-medium text-slate-400 ml-4 border-l border-slate-700 pl-4">
          User: <span className="text-slate-200">{user?.username}</span>
        </div>
        <button onClick={onLogout} className="flex items-center space-x-2 text-slate-400 hover:text-rose-400 font-semibold transition-colors bg-slate-800 hover:bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl text-sm">
          <span>Sign Out</span>
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
