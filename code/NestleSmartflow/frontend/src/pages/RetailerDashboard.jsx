import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, LogOut, Clock, FileText, CheckCircle, CreditCard, Download, Sparkles, PackagePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://nestle-smartflow--chiranivihanxa.replit.app/api';

export default function RetailerDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [retailerId, setRetailerId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // Order Creation State
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!token || user?.role !== 'RETAILER') {
      navigate('/');
      return;
    }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [dashRes, prodRes] = await Promise.all([
        axios.get(`${API_URL}/retailer/dashboard`, { headers }),
        axios.get(`${API_URL}/products`, { headers })
      ]);
      
      setDeliveries(dashRes.data.deliveries);
      const rId = dashRes.data.retailer_id;
      setRetailerId(rId);
      setProducts(prodRes.data);

      if (rId) {
        loadRecommendations(rId, headers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadRecommendations = async (rId, headers) => {
    try {
      const { data } = await axios.get(`${API_URL}/orders/recommendation/${rId}`, { headers });
      setRecommendations(data.recommendations || []);
      if (data.recommendations && data.recommendations.length > 0) {
        setOrderItems(data.recommendations.map(r => ({ product_id: r.product_id, quantity: r.recommended_quantity })));
      } else {
        setOrderItems([{ product_id: '', quantity: 1 }]);
      }
    } catch (err) {
      console.error("Error loading recommendations", err);
      setOrderItems([{ product_id: '', quantity: 1 }]);
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
    if (!retailerId) return alert('Retailer ID not found. Cannot create order.');
    const validItems = orderItems.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) return alert('Please add at least one valid item.');
    
    setIsSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/orders`, {
        retailer_id: retailerId,
        items: validItems
      }, { headers });
      
      alert('Order requested successfully! Notification sent to Warehouse.');
      
      // Refresh dashboard
      fetchDashboard();
    } catch (err) {
      alert('Error creating order');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const viewReceipt = (delivery) => {
    setSelectedReceipt(delivery);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 lg:p-8 relative selection:bg-blue-500/30 selection:text-blue-200">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-900/60 backdrop-blur-md p-4 sm:px-8 rounded-2xl shadow-lg border border-slate-700/50 relative z-10">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-inner">
             <Package className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Smart<span className="text-indigo-500">Flow</span></h1>
            <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mt-1">RETAILER PORTAL</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-sm font-medium text-slate-400 ml-4 border-l border-slate-700 pl-4">
            User: <span className="text-slate-200">{user?.username}</span>
          </div>
          <button onClick={logout} className="flex items-center space-x-2 text-slate-400 hover:text-rose-400 font-semibold transition-colors bg-slate-800 hover:bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl text-sm">
            <span>Sign Out</span>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        {/* Order Request Panel */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-8 flex flex-col">
          <h2 className="text-xl items-center font-bold mb-6 flex text-white tracking-tight">
            <div className="bg-blue-500/20 p-2 rounded-xl mr-3 shadow-inner border border-blue-500/30">
              <PackagePlus className="text-blue-400 w-5 h-5" />
            </div>
            Request Inventory
          </h2>
          <form onSubmit={submitOrder} className="space-y-5 flex-1 flex flex-col">
            {recommendations.length > 0 && (
              <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/30">
                <div className="flex items-center text-emerald-400 font-bold mb-1 text-sm">
                  <Sparkles className="w-4 h-4 mr-1.5" /> System Suggested Order
                </div>
                <p className="text-xs text-emerald-300/[0.7] leading-relaxed">
                  Based on your historical stock trends, optimal quantities have been pre-filled. You can adjust them before dispatching.
                </p>
              </div>
            )}

            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-400 mb-2 ml-1">Inventory Items</label>
              <div className="space-y-3">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select 
                      className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500/50 outline-none shadow-inner"
                      value={item.product_id}
                      onChange={(e) => updateOrderItem(idx, 'product_id', e.target.value)}
                      required
                    >
                      <option value="">Select Product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input 
                      type="number" min="1"
                      className="w-24 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500/50 outline-none shadow-inner text-center" 
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
              <button type="button" onClick={addOrderItem} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-semibold hover:underline flex items-center px-1 transition-colors">
                <span className="text-lg mr-1 leading-none">+</span> Add Row
              </button>
            </div>

            <div className="pt-4 mt-auto">
              <button disabled={isSubmitting} type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all disabled:opacity-50">
                {isSubmitting ? 'Dispatching...' : 'Dispatch Request to Warehouse'}
              </button>
            </div>
          </form>
        </div>

        {/* Deliveries & Receipts Panel */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-8 flex flex-col max-h-[85vh]">
          <h2 className="text-xl font-bold mb-6 flex items-center text-white tracking-tight">
            <div className="bg-slate-800 p-2 rounded-xl mr-3 shadow-inner border border-slate-700">
              <Clock className="text-indigo-400 w-5 h-5" />
            </div>
            Delivery & Payment History
          </h2>

          <div className="space-y-4 overflow-y-auto pr-2">
            {deliveries.map(del => (
              <div key={del.delivery_id} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-200">Order #{del.order_id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                      del.delivery_status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {del.delivery_status}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-200">
                      LKR {parseFloat(del.total_amount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  {del.delivery_time ? new Date(del.delivery_time).toLocaleString() : 'In transit'}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-1">
                  {del.items?.map((item, idx) => (
                    <span key={idx} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">
                      {item.quantity}x {item.product_name}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-800/50">
                  <div className="flex items-center gap-2">
                    {del.payment_status === 'PAID' ? (
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> PAID
                      </span>
                    ) : (
                      <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
                        <Clock size={12} /> PENDING PAY
                      </span>
                    )}
                  </div>
                  {del.delivery_status === 'DELIVERED' && (
                    <button 
                      onClick={() => viewReceipt(del)}
                      className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-600/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <FileText size={12} /> E-Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
            {deliveries.length === 0 && (
              <div className="text-center p-8 text-slate-500 font-medium">No deliveries found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="p-6 overflow-y-auto" id="receipt-content">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black tracking-tight">Nestlé SmartFlow</h2>
                <p className="text-sm text-slate-500 uppercase tracking-widest mt-1">Proof of Delivery & Settlement</p>
              </div>
              
              <div className="flex justify-between text-sm mb-6 pb-6 border-b border-slate-200">
                <div>
                  <p className="font-bold text-slate-700">Order #{selectedReceipt.order_id}</p>
                  <p className="text-slate-500">{new Date(selectedReceipt.delivery_time).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-700">Retailer ID: {retailerId}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase">Delivered Items</h3>
                <div className="space-y-2">
                  {selectedReceipt.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product_name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mb-6">
                <div className="flex justify-between items-center text-lg font-black">
                  <span>Total Amount</span>
                  <span>LKR {parseFloat(selectedReceipt.total_amount || 0).toFixed(2)}</span>
                </div>
                {selectedReceipt.payment && (
                  <div className="flex justify-between items-center text-sm text-slate-500 mt-2">
                    <span className="flex items-center gap-1"><CreditCard size={14}/> Paid via {selectedReceipt.payment.method}</span>
                    <span>{selectedReceipt.payment.method === 'CHEQUE' ? `Ref: ${selectedReceipt.payment.cheque_number}` : ''}</span>
                  </div>
                )}
              </div>

              {selectedReceipt.payment && selectedReceipt.payment.retailer_signature && (
                <div className="mt-8 border-t border-slate-200 pt-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-2">Retailer Signature</p>
                    <img src={selectedReceipt.payment.retailer_signature} alt="Retailer Sig" className="h-16 object-contain" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-2">Distributor Signature</p>
                    <img src={selectedReceipt.payment.distributor_signature} alt="Distributor Sig" className="h-16 object-contain" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-200">
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <Download size={16} /> Save / Print
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
