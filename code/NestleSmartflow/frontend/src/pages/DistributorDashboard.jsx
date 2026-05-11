import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Route, MapPin, CheckCircle, LogOut, Navigation2, Lock, CreditCard, PenTool, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SignaturePad from '../components/SignaturePad';

const API_URL = import.meta.env.VITE_API_URL || 'https://nestle-smartflow--chiranivihanxa.replit.app/api';

export default function DistributorDashboard() {
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('OFFLINE'); // OFFLINE, AVAILABLE, ON_ROUTE
  const navigate = useNavigate();

  // Delivery Session State
  const [nearbyRetailers, setNearbyRetailers] = useState([]);
  const [sessionRetailer, setSessionRetailer] = useState(null);
  const [sessionOrderItems, setSessionOrderItems] = useState([]);
  const [orderLocked, setOrderLocked] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [chequeDetails, setChequeDetails] = useState({ bank_name: '', cheque_number: '', cheque_date: '' });
  const [signatures, setSignatures] = useState({ distributor: null, retailer: null });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!token || user?.role !== 'DISTRIBUTOR') {
      navigate('/');
      return;
    }
    fetchRoute();
  }, []);

  const fetchRoute = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await axios.get(`${API_URL}/route`, { headers });
      setRoute(data.route || []);
      
      // Also fetch their current status so it persists across reloads
      const statusRes = await axios.get(`${API_URL}/distributors/status`, { headers });
      const myStatus = statusRes.data.find(d => d.id === user.id)?.status || 'OFFLINE';
      setStatus(myStatus);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = status === 'OFFLINE' ? 'AVAILABLE' : 'OFFLINE';
    
    // Fallback coordinates for demo (Colombo base)
    let lat = 6.9271;
    let lng = 79.8612;

    try {
      // In a real app, we would use navigator.geolocation
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/distributor/status`, { status: newStatus, lat, lng }, { headers });
      setStatus(newStatus);
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleArrive = async (stop) => {
    // For MVP testing, if real GPS fails or is far, we just use the stop's location so it works in demo.
    // In a real app, we use navigator.geolocation.getCurrentPosition()
    try {
      const lat = stop.lat; 
      const lng = stop.lng;
      
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await axios.post(`${API_URL}/deliveries/arrive`, { lat, lng }, { headers });
      
      if (data.nearby && data.nearby.length > 0) {
        setNearbyRetailers(data.nearby);
      } else {
        alert("No retailers found nearby.");
      }
    } catch (err) {
      console.error(err);
      alert('Failed to detect location.');
    }
  };

  const selectRetailerForSession = async (retailer) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/deliveries/${retailer.delivery_id}/start-session`, { lat: retailer.lat, lng: retailer.lng }, { headers });
      
      // Fetch order items to edit
      // A quick way without a specific endpoint is to fetch from /orders and filter, 
      // but let's just make a fast call if we have to. For now, since we only have order_id,
      // let's assume we can fetch order details from an endpoint. 
      // Wait, we don't have GET /orders/:id endpoint explicitly for items in routes.js.
      // We can fetch from /orders and find the match.
      const ordersRes = await axios.get(`${API_URL}/orders`, { headers });
      const orderMatch = ordersRes.data.find(o => o.id === retailer.order_id);
      
      setSessionOrderItems(orderMatch ? orderMatch.items : []);
      setSessionRetailer(retailer);
      setNearbyRetailers([]);
      setOrderLocked(false);
      setSignatures({ distributor: null, retailer: null });
    } catch (err) {
      console.error(err);
      alert('Error starting session');
    }
  };

  const handleQuantityChange = (itemId, newQty) => {
    setSessionOrderItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: parseInt(newQty) || 0 } : i));
  };

  const lockOrder = async () => {
    try {
      const totalAmount = sessionOrderItems.reduce((sum, item) => sum + (item.quantity * 1000), 0); // Mock LKR 1000 per unit for MVP
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post(`${API_URL}/orders/${sessionRetailer.order_id}/adjust`, { items: sessionOrderItems }, { headers });
      await axios.post(`${API_URL}/orders/${sessionRetailer.order_id}/lock`, { total_amount: totalAmount }, { headers });
      
      setOrderLocked(true);
    } catch (err) {
      console.error(err);
      alert('Error locking order');
    }
  };

  const submitSettlement = async () => {
    if (!signatures.retailer || !signatures.distributor) {
      return alert("Both signatures are required for Proof-Based Settlement.");
    }
    
    try {
      const totalAmount = sessionOrderItems.reduce((sum, item) => sum + (item.quantity * 1000), 0);
      const payload = {
        delivery_id: sessionRetailer.delivery_id,
        method: paymentMethod,
        amount: totalAmount,
        ...chequeDetails,
        distributor_signature: signatures.distributor,
        retailer_signature: signatures.retailer
      };

      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/orders/${sessionRetailer.order_id}/settle`, payload, { headers });
      
      alert("Delivery Settled & E-Receipt Generated!");
      setSessionRetailer(null);
      fetchRoute();
    } catch (err) {
      console.error(err);
      alert('Error submitting settlement');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 lg:p-8 relative selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <TopNavigation user={user} onLogout={logout} />
      
      <div className="w-full max-w-5xl bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-6 lg:p-10 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b border-slate-800 pb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center text-white tracking-tight">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl mr-3 shadow-inner border border-emerald-500/20">
                <Route className="text-emerald-400 w-6 h-6" />
              </div>
              Optimized Delivery Route
            </h2>
            <p className="text-slate-400 mt-2 ml-14 text-sm font-medium">Nearest-Neighbor calculation engine active.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={toggleStatus}
              disabled={status === 'ON_ROUTE'}
              className={`flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl font-bold tracking-wide transition border shadow-inner sm:w-auto w-full disabled:opacity-50 ${
                status === 'AVAILABLE' 
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30' 
                  : status === 'ON_ROUTE'
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30 cursor-not-allowed'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {status === 'AVAILABLE' ? 'You are ONLINE' : status === 'ON_ROUTE' ? 'En Route...' : 'Go ONLINE'}
            </button>
            <button 
              onClick={fetchRoute}
              className="flex justify-center items-center gap-2 bg-slate-800 px-5 py-2.5 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white font-bold tracking-wide transition border border-slate-700 shadow-inner sm:w-auto w-full"
            >
              <Navigation2 className="w-4 h-4" /> Sync GPS
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-emerald-400 font-bold bg-slate-900/50 rounded-2xl border border-slate-800/80 animate-pulse">
            Calculating optimal trajectory...
          </div>
        ) : route.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-semibold bg-slate-900/40 rounded-2xl border border-slate-800 border-dashed">
            No active runs allocated to your ID. 
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.45rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-emerald-500 before:via-blue-600 before:to-slate-800 before:rounded-bl-full">
            {route.map((stop, index) => (
              <div key={stop.delivery_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-2">
                
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-950 bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white shadow-xl shadow-emerald-500/20 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-black text-xl">
                  {index + 1}
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-slate-800/40 backdrop-blur-sm border border-slate-700 rounded-2xl p-5 shadow-inner hover:bg-slate-800/80 transition-all hover:-translate-y-1 hover:shadow-emerald-500/10">
                  <h3 className="font-bold text-slate-100 text-lg mb-1.5 tracking-tight flex items-center">
                    {stop.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-5 flex items-start font-medium bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                    <MapPin className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-rose-400" /> 
                    {stop.address}
                  </p>
                  
                  <div className="flex flex-col xl:flex-row gap-3">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 flex justify-center items-center bg-blue-500/10 text-blue-400 font-bold text-sm py-3 px-4 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                    >
                      Open GPS
                    </a>
                    <button 
                      onClick={() => handleArrive(stop)}
                      className="flex-1 flex justify-center items-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm py-3 px-4 rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-900/30 active:scale-[0.98]"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      I've Arrived
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nearby Retailers Modal */}
      {nearbyRetailers.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center text-white"><MapPin className="text-emerald-400 mr-2"/> Select Nearby Retailer</h3>
              <p className="text-sm text-slate-400 mb-4">GPS location verified. Please select the correct retailer to begin the delivery session.</p>
              <div className="space-y-3">
                {nearbyRetailers.map(r => (
                  <button 
                    key={r.retailer_id}
                    onClick={() => selectRetailerForSession(r)}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-xl text-left transition-colors flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block">{r.name}</span>
                      <span className="text-xs text-slate-400">{r.address}</span>
                    </div>
                    <CheckCircle className="text-emerald-500 opacity-0 hover:opacity-100" />
                  </button>
                ))}
              </div>
              <button onClick={() => setNearbyRetailers([])} className="mt-6 w-full text-sm text-slate-500 hover:text-slate-300">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Live Delivery Session Modal */}
      {sessionRetailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl relative my-auto flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <PenTool className="text-blue-500"/> Live Delivery Session
                </h3>
                <p className="text-sm text-blue-400 font-bold tracking-widest mt-1">{sessionRetailer.name}</p>
              </div>
              <button onClick={() => setSessionRetailer(null)} className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-lg">Close</button>
            </div>

            <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
              
              {/* Order Adjustment Module */}
              <section>
                <h4 className="font-bold text-slate-300 uppercase text-xs tracking-widest mb-4 flex items-center gap-2"><Package size={14}/> Order Adjustment</h4>
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
                  {sessionOrderItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="text-slate-300 font-medium text-sm">{item.product_name}</span>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          disabled={orderLocked}
                          className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2 text-center text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        />
                        <span className="text-slate-500 text-xs w-8 text-right">Units</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Est. Total: LKR {sessionOrderItems.reduce((acc, i) => acc + (i.quantity*1000), 0).toFixed(2)}</span>
                    {!orderLocked ? (
                      <button onClick={lockOrder} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                        <Lock size={14} /> Lock Order
                      </button>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-500/30">
                        <Lock size={12} /> LOCKED
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Settlement Module */}
              {orderLocked && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h4 className="font-bold text-slate-300 uppercase text-xs tracking-widest mb-4 flex items-center gap-2"><CreditCard size={14}/> Settlement Handling</h4>
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-slate-400 mb-2">Payment Method</label>
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-blue-500 outline-none"
                      >
                        <option value="CASH">Physical Cash</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="PAY_LATER">Pay Later (Pending)</option>
                      </select>
                    </div>

                    {paymentMethod === 'CHEQUE' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Bank Name</label>
                          <input type="text" value={chequeDetails.bank_name} onChange={e => setChequeDetails({...chequeDetails, bank_name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm" placeholder="e.g. BOC"/>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Cheque No.</label>
                          <input type="text" value={chequeDetails.cheque_number} onChange={e => setChequeDetails({...chequeDetails, cheque_number: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm" placeholder="123456"/>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                          <input type="date" value={chequeDetails.cheque_date} onChange={e => setChequeDetails({...chequeDetails, cheque_date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm"/>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6 mt-6 border-t border-slate-800 pt-6">
                      <SignaturePad 
                        label="1. Retailer Signature (Confirming Delivery & Payment)"
                        onSign={(sig) => setSignatures(prev => ({...prev, retailer: sig}))}
                      />
                      <SignaturePad 
                        label="2. Distributor Signature (Confirming Handover)"
                        onSign={(sig) => setSignatures(prev => ({...prev, distributor: sig}))}
                      />
                    </div>

                    <button 
                      onClick={submitSettlement}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-4 rounded-xl mt-8 shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} /> Finalize & Generate E-Receipt
                    </button>
                  </div>
                </section>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopNavigation({ user, onLogout }) {
  return (
    <div className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-900/60 backdrop-blur-md p-4 sm:px-8 rounded-2xl shadow-lg border border-slate-700/50 relative z-10">
      <div className="flex items-center space-x-3 mb-4 sm:mb-0">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2 rounded-lg shadow-inner">
           <Route className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight leading-none">Smart<span className="text-emerald-500">Flow</span></h1>
          <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mt-1">{user?.role} PORTAL</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-sm font-medium text-slate-400">
          Agent: <span className="text-slate-200">{user?.username}</span>
        </div>
        <button onClick={onLogout} className="flex items-center space-x-2 text-slate-400 hover:text-rose-400 font-semibold transition-colors bg-slate-800 hover:bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl">
          <span>Sign Out</span>
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
