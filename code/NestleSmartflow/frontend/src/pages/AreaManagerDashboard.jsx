import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PackagePlus, LogOut, Sparkles, MapPin, Store, AlertTriangle, ChevronRight, Activity, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://nestle-smartflow--chiranivihanxa.replit.app/api';

export default function AreaManagerDashboard() {
  const [retailers, setRetailers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [retailerForm, setRetailerForm] = useState({ name: '', address: '', lat: '', lng: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Sprint 3: Retailer Profiles View
  const [extendedRetailers, setExtendedRetailers] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);

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
      const [retRes, prodRes, extRetRes] = await Promise.all([
        axios.get(`${API_URL}/retailers`, { headers }),
        axios.get(`${API_URL}/products`, { headers }),
        axios.get(`${API_URL}/area-manager/retailers`, { headers })
      ]);
      setRetailers(retRes.data);
      setProducts(prodRes.data);
      setExtendedRetailers(extRetRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCoordinates = async () => {
    if (!retailerForm.address) return alert('Please enter an address first');
    setIsGeocoding(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(retailerForm.address)}`);
      if (res.data && res.data.length > 0) {
        setRetailerForm({ 
          ...retailerForm, 
          lat: parseFloat(res.data[0].lat).toFixed(6), 
          lng: parseFloat(res.data[0].lon).toFixed(6) 
        });
      } else {
        alert('Location not found. Please try a more specific address.');
      }
    } catch (err) {
      alert('Error fetching coordinates');
    } finally {
      setIsGeocoding(false);
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
        setOrderItems(data.recommendations.map(r => ({ product_id: r.product_id, quantity: r.recommended_quantity })));
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
      fetchData();
    } catch (err) {
      alert('Error creating order');
    }
  };

  const handleRetailerSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/retailers`, retailerForm, { headers: { Authorization: `Bearer ${token}` } });
      setShowModal(false);
      setRetailerForm({ name: '', address: '', lat: '', lng: '' });
      fetchData();
    } catch (err) {
      alert('Error creating retailer');
    } finally {
      setActionLoading(false);
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
      
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        <div className="space-y-8">
          {/* Order Creation Panel */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-8 flex flex-col h-full">
            <h2 className="text-xl items-center font-bold mb-6 flex text-white tracking-tight">
              <div className="bg-blue-500/20 p-2 rounded-xl mr-3 shadow-inner border border-blue-500/30">
                <PackagePlus className="text-blue-400 w-5 h-5" />
              </div>
              Create New Order
            </h2>
            <form onSubmit={submitOrder} className="space-y-5 flex-1 flex flex-col">
              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-sm font-semibold text-slate-400">Select Retailer</label>
                  <button type="button" onClick={() => setShowModal(true)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline inline-flex items-center">
                    + New Retailer
                  </button>
                </div>
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

        {/* Retailer Profiles Panel */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-8 flex flex-col max-h-[85vh]">
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

      {/* Add Retailer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95">
            <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">New Retailer</h2>
            <form onSubmit={handleRetailerSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-400">Store Name</label>
                <input required className="w-full mt-1.5 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none" value={retailerForm.name} onChange={e=>setRetailerForm({...retailerForm, name: e.target.value})} placeholder="e.g. City Supermarket" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-400">Complete Address</label>
                <div className="relative mt-1.5 flex items-center">
                  <input required className="w-full pl-4 pr-32 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none" value={retailerForm.address} onChange={e=>setRetailerForm({...retailerForm, address: e.target.value})} placeholder="e.g. 15 Baker St, NY" />
                  <button type="button" onClick={fetchCoordinates} disabled={isGeocoding} className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-semibold rounded-lg flex items-center text-xs transition-colors disabled:opacity-50">
                    <MapPin className="w-3 h-3 mr-1" /> {isGeocoding ? 'Finding...' : 'Auto-Fill'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 mt-4">
                <div className="col-span-2"><p className="text-xs text-slate-500 font-medium pb-1">Geodata (Required for Distributor Delivery Map)</p></div>
                <div>
                  <label className="text-sm font-semibold text-slate-400">Latitude</label>
                  <input required type="number" step="any" className="w-full mt-1.5 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none" value={retailerForm.lat} onChange={e=>setRetailerForm({...retailerForm, lat: e.target.value})} placeholder="6.9319" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-400">Longitude</label>
                  <input required type="number" step="any" className="w-full mt-1.5 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none" value={retailerForm.lng} onChange={e=>setRetailerForm({...retailerForm, lng: e.target.value})} placeholder="79.8478" />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-8 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50">{actionLoading ? 'Saving...' : 'Save Retailer'}</button>
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
    <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-900/60 backdrop-blur-md p-4 sm:px-8 rounded-2xl shadow-lg border border-slate-700/50 relative z-10">
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
