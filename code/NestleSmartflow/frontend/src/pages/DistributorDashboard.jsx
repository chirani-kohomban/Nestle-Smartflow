import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Route, MapPin, CheckCircle, LogOut, Navigation2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://nestle-smartflow--chiranivihanxa.replit.app/api';

export default function DistributorDashboard() {
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markDelivered = async (deliveryId) => {
    try {
      await axios.post(`${API_URL}/deliveries/update-status`, {
        delivery_id: deliveryId
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      fetchRoute(); 
    } catch (err) {
      alert('Error updating delivery status');
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
          
          <button 
            onClick={fetchRoute}
            className="flex justify-center items-center gap-2 bg-slate-800 px-5 py-2.5 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white font-bold tracking-wide transition border border-slate-700 shadow-inner sm:w-auto w-full"
          >
            <Navigation2 className="w-4 h-4" /> Sync GPS
          </button>
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
                
                {/* Node marker */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-950 bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white shadow-xl shadow-emerald-500/20 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-black text-xl">
                  {index + 1}
                </div>
                
                {/* Card */}
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
                      onClick={() => markDelivered(stop.delivery_id)}
                      className="flex-1 flex justify-center items-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm py-3 px-4 rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-900/30 active:scale-[0.98]"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Delivered
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
