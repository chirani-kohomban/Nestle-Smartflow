import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../api';
import { useNavigate } from 'react-router-dom';
import { PackageOpen, ArrowRight } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await fetchApi('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass max-w-md w-full p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-brand/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                <div className="flex flex-col items-center mb-8 relative z-10">
                    <div className="w-16 h-16 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
                        <PackageOpen className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">SmartFlow</h1>
                    <p className="text-slate-500 text-sm mt-1">Warehouse Management MVP</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <input 
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-slate-400"
                            placeholder="admin or staff"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input 
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-slate-400"
                            placeholder="password123"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-brand hover:bg-brandLight text-white font-medium py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                    >
                        {loading ? 'Logging in...' : 'Sign In'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <p className="text-xs text-center text-slate-400 mt-4">
                        Test accounts: <br/> username: admin / password: password123 <br/> username: staff / password: password123
                    </p>
                </form>
            </div>
        </div>
    );
}
