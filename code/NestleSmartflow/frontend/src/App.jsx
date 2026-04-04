import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import WarehouseDashboard from './pages/WarehouseDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import { Package, LogOut } from 'lucide-react';

function ProtectedRoute({ children }) {
    const { token, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return token ? children : <Navigate to="/login" />;
}

function Layout({ children }) {
    const { user, logout } = useAuth();
    return (
        <div className="min-h-screen flex flex-col">
            <nav className="glass sticky top-0 z-50 rounded-none border-t-0 border-l-0 border-r-0 mb-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand font-bold text-xl">
                        <Package className="w-6 h-6" />
                        <span>SmartFlow</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                            {user?.role}: {user?.username}
                        </span>
                        <button onClick={logout} className="text-slate-500 hover:text-red-500 transition-colors p-2">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12">
                {children}
            </main>
        </div>
    );
}

function RoleBasedRouter() {
    const { user } = useAuth();
    if (user?.role === 'ADMIN') return <AdminDashboard />;
    if (user?.role === 'STAFF') return <WarehouseDashboard />;
    if (user?.role === 'MANAGER') return <ManagerDashboard />;
    return <div>Unauthorized Role</div>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
            <ProtectedRoute>
                <Layout>
                    <RoleBasedRouter />
                </Layout>
            </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
