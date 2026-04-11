import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PackagePlus, LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AreaManagerDashboard() {
  const [retailers, setRetailers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
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
      const [retRes, prodRes] = await Promise.all([
        axios.get(`${API_URL}/retailers`, { headers }),
        axios.get(`${API_URL}/products`, { headers })
      ]);
      setRetailers(retRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRecommendations = async (retailerId) => {
    setSelectedRetailer(retailerId);
    if (!retailerId) {
      setRecommendations([]);
      setOrderItems([]);
      return;
    }
    try {
      const { data } = await axios.get(`${API_URL}/orders/recommendation/${retailerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendations(data.recommendations || []);
      
      if (data.recommendations && data.recommendations.length > 0) {
        setOrderItems(data.recommendations.map(r => ({
          product_id: r.product_id,
          quantity: r.recommended_quantity
        })));
      } else {
        setOrderItems([]);
      }
    } catch (err) {
      console.error("Error loading recommendations", err);
    }
  };

  const addOrderItem = () => setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  
  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    setOrderItems(newItems);
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!selectedRetailer || orderItems.length === 0) return alert('Select retailer and items');
    try {
      await axios.post(`${API_URL}/orders`, {
        retailer_id: selectedRetailer,
        items: orderItems.filter(i => i.product_id && i.quantity > 0)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert('Order created successfully!');
      setSelectedRetailer('');
      setOrderItems([]);
      setRecommendations([]);
    } catch (err) {
      alert('Error creating order');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 lg:p-8 relative selection:bg-blue-500/30 selection:text-blue-200">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <TopNavigation user={user} onLogout={logout} />
      
      <div className="w-full max-w-3xl grid grid-cols-1 gap-8 relative z-10">
        
        {/* Order Creation Panel */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-8 flex flex-col">
          <h2 className="text-xl items-center font-bold mb-6 flex text-white tracking-tight">
            <div className="bg-blue-500/20 p-2 rounded-xl mr-3 shadow-inner border border-blue-500/30">
              <PackagePlus className="text-blue-400 w-5 h-5" />
            </div>
            Create New Order
          </h2>
          <form onSubmit={submitOrder} className="space-y-5 flex-1">
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2 ml-1">Select Retailer Location</label>
              <select 
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
                value={selectedRetailer}
                onChange={(e) => loadRecommendations(e.target.value)}
                required
              >
                <option value="" className="text-slate-500">-- Choose Retailer --</option>
                {retailers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            {recommendations.length > 0 && (
              <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/30">
                <div className="flex items-center text-emerald-400 font-bold mb-1 text-sm">
                  <Sparkles className="w-4 h-4 mr-1.5" /> Smart Template Active
                </div>
                <p className="text-xs text-emerald-300/[0.7] leading-relaxed">
                  Based on historical trends, optimal quantities have been pre-filled.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2 ml-1">Inventory Items</label>
              <div className="space-y-3">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select 
                      className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none shadow-inner"
                      value={item.product_id}
                      onChange={(e) => updateOrderItem(idx, 'product_id', e.target.value)}
                      required
                    >
                      <option value="">Product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input 
                      type="number" min="1"
                      className="w-20 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none shadow-inner text-center" 
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(idx, 'quantity', e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => {
                      const idxs = [...orderItems];
                      idxs.splice(idx, 1);
                      setOrderItems(idxs);
                    }} className="text-red-400/80 hover:text-red-400 hover:bg-red-500/10 px-3 rounded-xl transition-all font-bold">✕</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addOrderItem} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-semibold hover:underline flex items-center px-1 transition-colors">
                <span className="text-lg mr-1 leading-none">+</span> Add Row
              </button>
            </div>

            <div className="pt-4 mt-auto">
              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all">
                Dispatch Order
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

function TopNavigation({ user, onLogout }) {
  return (
    <div className="w-full max-w-3xl flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-900/60 backdrop-blur-md p-4 sm:px-8 rounded-2xl shadow-lg border border-slate-700/50 relative z-10">
      <div className="flex items-center space-x-3 mb-4 sm:mb-0">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-inner">
           <PackagePlus className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight leading-none">Smart<span className="text-blue-500">Flow</span></h1>
          <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mt-1">AREA MANAGER PORTAL</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-sm font-medium text-slate-400">
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
