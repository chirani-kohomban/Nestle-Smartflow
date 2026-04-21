import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, LogOut, PackageCheck, Box, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://nestle-smartflow--chiranivihanxa.replit.app/api';

export default function WarehouseDashboard() {
  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState({});
  const [adjustmentModal, setAdjustmentModal] = useState({ show: false, product: null, change: '' });
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!token || user?.role !== 'WAREHOUSE') {
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ordRes, distRes, prodRes] = await Promise.all([
        axios.get(`${API_URL}/orders`, { headers }),
        axios.get(`${API_URL}/distributors`, { headers }),
        axios.get(`${API_URL}/products`, { headers }) 
      ]);
      setOrders(ordRes.data.filter(o => o.status === 'PENDING' || o.status === 'ALLOCATED'));
      setDistributors(distRes.data);
      setInventory(prodRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatch = async (orderId) => {
    const distId = selectedDistributor[orderId];
    if (!distId) return alert('Please select a distributor to assign.');

    try {
      await axios.post(`${API_URL}/dispatch`, {
        order_id: orderId,
        distributor_id: distId
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      fetchData(); // Refresh UI
    } catch (err) {
      alert(err.response?.data?.message || 'Error dispatching order. Possibly insufficient stock.');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/inventory/adjust`, {
        product_id: adjustmentModal.product.id,
        quantity_change: parseInt(adjustmentModal.change)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setAdjustmentModal({ show: false, product: null, change: '' });
      fetchData(); // Refresh UI to match
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating stock.');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 lg:p-8 relative selection:bg-amber-500/30 selection:text-amber-200">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-amber-900/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <TopNavigation user={user} onLogout={logout} />
      
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Pending Orders to Dispatch */}
        <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold flex items-center text-white tracking-tight">
              <div className="bg-amber-500/10 p-2.5 rounded-xl mr-3 shadow-inner border border-amber-500/20">
                <Truck className="text-amber-400 w-6 h-6" />
              </div>
              Dispatch Queue
            </h2>
            <span className="bg-slate-800 text-amber-400 text-xs font-black uppercase px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner">
              {orders.length} Pending
            </span>
          </div>
          
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-slate-500 text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed font-medium">
                No pending orders to dispatch. All clear!
              </div>
            ) : orders.map(o => (
              <div key={o.id} className="border border-slate-700/60 rounded-2xl p-5 bg-slate-800/20 hover:bg-slate-800/40 transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-100 text-lg tracking-tight flex items-center gap-2">
                       {o.retailer_name} 
                       <span className="text-sm font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md">#{o.id}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Placed: {new Date(o.created_at).toLocaleString()}</p>
                  </div>
                  <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-lg font-bold border border-amber-500/20 shadow-inner">
                    {o.status}
                  </span>
                </div>
                
                <div className="mb-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <strong className="text-xs uppercase tracking-widest text-slate-500 block mb-2 px-1">Items to Allocate</strong>
                  <div className="flex flex-wrap gap-2 text-sm text-slate-300 px-1">
                    {o.items?.map(i => (
                      <span key={i.id} className="bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-sm flex items-center">
                        <Box className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                        <strong className="text-white mr-1.5">{i.quantity}x</strong> {i.product_name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-700/50">
                  <select 
                    className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 shadow-inner flex-1"
                    value={selectedDistributor[o.id] || ''}
                    onChange={(e) => setSelectedDistributor({...selectedDistributor, [o.id]: e.target.value})}
                  >
                    <option value="" className="text-slate-500">Assign Courier Route...</option>
                    {distributors.map(d => <option key={d.id} value={d.id}>{d.username} (Route Driver)</option>)}
                  </select>
                  <button 
                    onClick={() => handleDispatch(o.id)}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-amber-900/40 transition-all active:scale-[0.98] sm:w-auto w-full"
                  >
                    Allocate & Dispatch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Inventory Preview */}
        <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-6 lg:p-8 max-h-[600px] overflow-y-auto flex flex-col">
          <div className="sticky top-0 bg-slate-900/90 backdrop-blur py-2 mb-4 border-b border-slate-800 z-10">
            <h2 className="text-xl font-bold flex items-center text-white tracking-tight pb-2">
              <div className="bg-blue-500/10 p-2.5 rounded-xl mr-3 shadow-inner border border-blue-500/20">
                <PackageCheck className="text-blue-400 w-5 h-5" />
              </div>
              Live Inventory
            </h2>
          </div>
          <div className="space-y-3">
            {inventory.map(prod => (
              <div key={prod.id} className="flex justify-between items-center p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                <div>
                  <div className="font-bold text-slate-200 text-sm">{prod.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-wider">{prod.sku}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-xl font-black px-3 py-1 rounded-lg border ${
                    prod.quantity > 50 
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-inner' 
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-inner'
                    }`}>
                    {prod.quantity || 0}
                  </div>
                  <button 
                    onClick={() => setAdjustmentModal({ show: true, product: prod, change: '' })}
                    className="p-2 bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                    title="Adjust Stock"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {adjustmentModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-sm w-full p-8">
            <h2 className="text-xl font-bold mb-2 text-white">Adjust Stock</h2>
            <p className="text-sm text-slate-400 mb-6 border-b border-slate-800 pb-4">
              Updating master inventory count for <br/><strong className="text-blue-400">{adjustmentModal.product.name}</strong>
            </p>
            
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-300">Quantity Adjustment</label>
                <input 
                  type="number" 
                  required 
                  className="w-full mt-2 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none text-center" 
                  value={adjustmentModal.change} 
                  onChange={e => setAdjustmentModal({...adjustmentModal, change: e.target.value})} 
                  placeholder="+50, -10, etc." 
                />
                <p className="text-xs text-slate-500 mt-2 text-center">Use negative numbers to remove damaged stock.</p>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-800 mt-6">
                <button type="button" onClick={() => setAdjustmentModal({ show: false, product: null, change: ''})} className="flex-1 py-2.5 rounded-xl font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TopNavigation({ user, onLogout }) {
  return (
    <div className="w-full max-w-7xl flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-900/60 backdrop-blur-md p-4 sm:px-8 rounded-2xl shadow-lg border border-slate-700/50 relative z-10">
      <div className="flex items-center space-x-3 mb-4 sm:mb-0">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-lg shadow-inner">
           <Truck className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight leading-none">Smart<span className="text-amber-500">Flow</span></h1>
          <p className="text-[10px] text-amber-400 uppercase tracking-widest font-bold mt-1">{user?.role} PORTAL</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-sm font-medium text-slate-400">
          User: <span className="text-slate-200">{user?.username}</span>
        </div>
        <button onClick={onLogout} className="flex items-center space-x-2 text-slate-400 hover:text-rose-400 font-semibold transition-colors bg-slate-800 hover:bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl">
          <span>Sign Out</span>
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
