import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, MapPin, Store, AlertTriangle, ChevronRight, DollarSign, BarChart3, Clock, Search, Download, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'https://nestle-smartflow--chiranivihanxa.replit.app/api';

export default function AreaManagerDashboard() {
  const [extendedRetailers, setExtendedRetailers] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!token || user?.role !== 'AREA_MANAGER') {
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [extRetRes, ordRes] = await Promise.all([
        axios.get(`${API_URL}/area-manager/retailers`, { headers }),
        axios.get(`${API_URL}/orders`, { headers })
      ]);
      setExtendedRetailers(Array.isArray(extRetRes.data) ? extRetRes.data : []);
      setOrders(Array.isArray(ordRes.data) ? ordRes.data : []);
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
    })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  };
  
  const chartData = getChartData();

  const filteredOrders = orders.filter(o => 
    o.retailer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id?.toString().includes(searchTerm) ||
    o.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.payment_status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 lg:p-8 relative selection:bg-blue-500/30 selection:text-blue-200">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <TopNavigation user={user} onLogout={logout} onDownload={downloadWeeklyReport} />
      
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 mb-8">
        
        {/* Retailer Profiles Panel */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-8 flex flex-col max-h-[500px]">
          <h2 className="text-xl items-center font-bold mb-6 flex text-white tracking-tight">
            <div className="bg-indigo-500/20 p-2 rounded-xl mr-3 shadow-inner border border-indigo-500/30">
              <Store className="text-indigo-400 w-5 h-5" />
            </div>
            Retailer Profiles & Performance
          </h2>
          
          <div className="overflow-y-auto pr-2 space-y-3 flex-1">
            {extendedRetailers.map(r => (
              <div key={r.id} className="bg-slate-950/50 hover:bg-slate-900 border border-slate-800 rounded-xl p-4 transition-all cursor-pointer group" onClick={() => setSelectedProfile(r)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-200 text-lg flex items-center gap-2">
                      {r.name}
                      {r.pending_payments_count > 2 && (
                        <span title="High Risk: Multiple Pending Payments" className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-500">
                          <AlertTriangle size={12} />
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center mt-1"><MapPin size={12} className="mr-1"/> {r.address}</p>
                  </div>
                  <ChevronRight className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Orders</p>
                    <p className="font-bold text-slate-300">{r.total_orders}</p>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Outstanding</p>
                    <p className={`font-bold ${r.outstanding_balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      LKR {parseFloat(r.outstanding_balance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {extendedRetailers.length === 0 && (
              <div className="text-center p-8 text-slate-500 font-medium">No retailers found in region.</div>
            )}
          </div>
        </div>

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
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 gap-8 relative z-10">
        {/* Order History Panel */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold flex items-center text-white tracking-tight">
              <div className="bg-slate-800 p-2 rounded-xl mr-3 shadow-inner border border-slate-700">
                <Clock className="text-slate-300 w-5 h-5" />
              </div>
              Active & Past Orders Ledger
            </h2>
            
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Search ledger..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
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
                {filteredOrders.map(o => (
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
                {filteredOrders.length === 0 && (
                  <tr><td colSpan="6" className="text-center p-8 text-slate-500 font-medium">No ledger entries found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Retailer Detail Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative">
            <button onClick={() => setSelectedProfile(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg text-sm">Close</button>
            
            <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Store className="text-white w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">{selectedProfile.name}</h2>
                <p className="text-slate-400 flex items-center text-sm mt-1"><MapPin size={14} className="mr-1"/> {selectedProfile.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <Activity className="text-blue-400 mb-2" size={24}/>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Lifetime Orders</p>
                <p className="text-xl font-bold text-slate-200">{selectedProfile.total_orders}</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <DollarSign className="text-emerald-400 mb-2" size={24}/>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Outstanding Bal.</p>
                <p className={`text-xl font-bold ${selectedProfile.outstanding_balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  LKR {parseFloat(selectedProfile.outstanding_balance || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
                {selectedProfile.pending_payments_count > 2 && <div className="absolute top-0 right-0 w-8 h-8 bg-rose-500/20 rounded-bl-full"></div>}
                <AlertTriangle className={selectedProfile.pending_payments_count > 2 ? 'text-rose-400 mb-2' : 'text-slate-600 mb-2'} size={24}/>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Pending Checkouts</p>
                <p className={`text-xl font-bold ${selectedProfile.pending_payments_count > 2 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {selectedProfile.pending_payments_count}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopNavigation({ user, onLogout, onDownload }) {
  return (
    <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-900/60 backdrop-blur-md p-4 sm:px-8 rounded-2xl shadow-lg border border-slate-700/50 relative z-10">
      <div className="flex items-center space-x-3 mb-4 sm:mb-0">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-inner">
           <Activity className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight leading-none">Smart<span className="text-blue-500">Flow</span></h1>
          <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mt-1">AREA MANAGER PORTAL</p>
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
