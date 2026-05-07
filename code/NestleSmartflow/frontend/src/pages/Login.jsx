import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://nestle-smartflow--chiranivihanxa.replit.app/api';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123'); // Default for demo
  const [role, setRole] = useState('NESTLE_MANAGER'); // Default for register
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);
    
    try {
      const endpoint = isRegister ? '/register' : '/login';
      const payload = isRegister ? { username, password, role } : { username, password };
      
      const res = await axios.post(`${API_URL}${endpoint}`, payload);
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      if (isRegister) {
          setSuccessMsg('Registration successful! Redirecting...');
          setTimeout(() => routeUser(user.role), 1000);
      } else {
          routeUser(user.role);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const routeUser = (userRole) => {
      switch(userRole) {
        case 'NESTLE_MANAGER': navigate('/nestle-manager'); break;
        case 'AREA_MANAGER': navigate('/area-manager'); break;
        case 'ADMIN': navigate('/admin'); break;
        case 'WAREHOUSE': navigate('/warehouse'); break;
        case 'DISTRIBUTOR': navigate('/distributor'); break;
        case 'RETAILER': navigate('/retailer'); break;
        default: navigate('/'); break;
      }
  };
  
  const toggleMode = () => {
      setIsRegister(!isRegister);
      setError('');
      setSuccessMsg('');
      if (!isRegister) setPassword(''); // clear pass when switching to register
      else setPassword('password123'); // reset to dummy when switching to login
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="relative z-10 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
            <Package className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Nestlé SmartFlow</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Supply Chain Intelligence</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center font-medium shadow-inner">
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-xl mb-6 text-sm text-center font-medium shadow-inner">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5 ml-1">Username</label>
            <input 
              type="text" 
              className="w-full bg-slate-950/50 border-slate-700 rounded-xl shadow-inner p-3.5 text-white placeholder-slate-500 border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. john_doe"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full bg-slate-950/50 border-slate-700 rounded-xl shadow-inner p-3.5 pr-12 text-white placeholder-slate-500 border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required 
                minLength={isRegister ? 6 : 1}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          {isRegister && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5 ml-1">Select Role</label>
              <select
                className="w-full bg-slate-950/50 border-slate-700 rounded-xl shadow-inner p-3.5 text-white border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="NESTLE_MANAGER">Nestle Manager</option>
                <option value="AREA_MANAGER">Area Manager</option>
                <option value="ADMIN">Administrator</option>
                <option value="WAREHOUSE">Warehouse Staff</option>
                <option value="DISTRIBUTOR">Delivery Distributor</option>
                <option value="RETAILER">Retailer</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98] mt-2 block"
          >
            {isLoading ? 'Processing...' : (isRegister ? 'Claim Access' : 'Login Portal')}
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <button 
                type="button" 
                onClick={toggleMode} 
                className="text-sm text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors focus:outline-none"
            >
                {isRegister ? 'Already have an account? Sign In.' : 'Need to register? Request Access.'}
            </button>
        </div>
        
        {!isRegister && (
            <div className="mt-6 text-[11px] text-slate-500 text-center font-medium p-4 bg-slate-950/30 rounded-xl border border-slate-800/80 leading-relaxed max-h-[220px] overflow-y-auto">
              <span className="text-slate-400 font-bold mb-1 block uppercase tracking-wider border-b border-slate-800 pb-1">Demo Directory</span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-left mt-2 px-1">
                 <div><span className="text-blue-400">Exec:</span> admin</div>
                 <div><span className="text-purple-400">Area:</span> area_manager</div>
                 <div><span className="text-emerald-400">Whouse:</span> warehouse</div>
                 <div><span className="text-amber-400">Driver 1:</span> distributor</div>
                 
                 <div className="col-span-2 mt-1.5 pt-1.5 border-t border-slate-800 text-amber-500/80 uppercase tracking-widest text-[9px]">Regional Delivery Trucks:</div>
                 <div className="truncate"><span className="text-amber-400">Kandy:</span> distributor_kandy</div>
                 <div className="truncate"><span className="text-amber-400">Galle:</span> distributor_galle</div>
                 <div className="col-span-2 truncate"><span className="text-amber-400">Col-South:</span> distributor_colombo_south</div>

                 <div className="col-span-2 mt-1.5 pt-1.5 border-t border-slate-800 text-indigo-500/80 uppercase tracking-widest text-[9px]">Retailer Profiles:</div>
                 <div className="truncate"><span className="text-indigo-400">Shop A:</span> shop_a</div>
                 <div className="truncate"><span className="text-indigo-400">Kandy:</span> shop_kandy</div>
                 <div className="truncate"><span className="text-indigo-400">Galle:</span> shop_galle</div>
                 <div className="truncate"><span className="text-indigo-400">Store D:</span> convenience_store_d</div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800">
                Password: <span className="text-slate-300 font-bold tracking-widest bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">password123</span>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
