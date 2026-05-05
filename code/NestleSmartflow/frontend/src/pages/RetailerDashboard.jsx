import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, LogOut, Clock, FileText, CheckCircle, CreditCard, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://nestle-smartflow--chiranivihanxa.replit.app/api';

export default function RetailerDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [retailerId, setRetailerId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
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
      const res = await axios.get(`${API_URL}/retailer/dashboard`, { headers });
      setDeliveries(res.data.deliveries);
      setRetailerId(res.data.retailer_id);
    } catch (err) {
      console.error(err);
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

      <div className="w-full max-w-5xl grid grid-cols-1 gap-8 relative z-10">
        
        {/* Deliveries & Receipts */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center text-white tracking-tight">
            <div className="bg-slate-800 p-2 rounded-xl mr-3 shadow-inner border border-slate-700">
              <Clock className="text-indigo-400 w-5 h-5" />
            </div>
            Delivery & Payment History
          </h2>

          <div className="space-y-4">
            {deliveries.map(del => (
              <div key={del.delivery_id} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-slate-200">Order #{del.order_id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      del.delivery_status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {del.delivery_status}
                    </span>
                    {del.payment_status === 'PAID' && (
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> PAID
                      </span>
                    )}
                    {del.payment_status === 'UNPAID' && (
                      <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                        <Clock size={12} /> PENDING PAY
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400 mb-2">
                    Delivered on: {del.delivery_time ? new Date(del.delivery_time).toLocaleString() : 'Not delivered yet'}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {del.items?.map((item, idx) => (
                      <span key={idx} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">
                        {item.quantity}x {item.product_name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                  <div className="text-xl font-bold text-slate-200">
                    LKR {parseFloat(del.total_amount || 0).toFixed(2)}
                  </div>
                  {del.delivery_status === 'DELIVERED' && (
                    <button 
                      onClick={() => viewReceipt(del)}
                      className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-600/30 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors w-full md:w-auto justify-center"
                    >
                      <FileText size={16} /> View E-Receipt
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
                      {/* Assuming price isn't stored per item in this MVP, just showing total */}
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
