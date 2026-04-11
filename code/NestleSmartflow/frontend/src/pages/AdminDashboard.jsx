import { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Search, Plus, Pencil, Trash2, Package, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [productForm, setProductForm] = useState({ id: null, name: '', sku: '', unit: '', initialQuantity: 0 });
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadProducts = async () => {
        try {
            const data = await fetchApi('/products');
            setProducts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProducts(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);
        try {
            if (editMode) {
                await fetchApi(`/products/${productForm.id}`, { method: 'PUT', body: JSON.stringify(productForm) });
            } else {
                await fetchApi('/products', { method: 'POST', body: JSON.stringify(productForm) });
            }
            setShowModal(false);
            loadProducts();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product? All related inventory history will be lost.')) return;
        try {
            await fetchApi(`/products/${id}`, { method: 'DELETE' });
            loadProducts();
        } catch (err) {
            alert(err.message);
        }
    };

    const openModal = (product = null) => {
        if (product) {
            setEditMode(true);
            setProductForm({ id: product.id, name: product.name, sku: product.sku, unit: product.unit });
        } else {
            setEditMode(false);
            setProductForm({ id: null, name: '', sku: '', unit: '', initialQuantity: 0 });
        }
        setShowModal(true);
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass p-6 flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-brand to-brandLight bg-clip-text text-transparent">Product Management</h1>
                    <p className="text-slate-500 font-medium mt-1">Add, edit, and configure product catalogs.</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => openModal()} className="relative z-10 bg-brand text-white px-5 py-2.5 rounded-xl shadow-[0_4px_14px_0_rgba(10,51,92,0.39)] hover:shadow-[0_6px_20px_rgba(10,51,92,0.23)] hover:bg-brandLight transition-all flex items-center gap-2 font-medium">
                      <Plus className="w-5 h-5"/> New Product
                  </button>
                  <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="relative z-10 bg-slate-800 text-slate-300 px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2 font-medium border border-slate-700">
                      Sign Out
                  </button>
                </div>
            </div>

            <div className="glass overflow-hidden">
                <div className="p-4 border-b border-white/40 bg-white/30 relative">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" placeholder="Search products..." 
                        className="w-full pl-10 pr-4 py-2 border rounded text-sm"
                        value={search} onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100/50 text-slate-500 text-sm border-b border-slate-200/50">
                        <tr>
                            <th className="p-4">SKU</th>
                            <th className="p-4">Product Name</th>
                            <th className="p-4">Unit</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="p-4 font-mono text-sm text-brand font-semibold">{item.sku}</td>
                                <td className="p-4 flex items-center gap-2"><Package className="w-4 h-4 text-slate-400"/> {item.name}</td>
                                <td className="p-4">{item.unit}</td>
                                <td className="p-4 text-right space-x-2">
                                    <button onClick={() => openModal(item)} className="p-2 text-slate-500 hover:text-blue-600 border rounded bg-white hover:bg-blue-50"><Pencil className="w-4 h-4"/></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-500 hover:text-red-600 border rounded bg-white hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4 text-slate-800">{editMode ? 'Edit Product' : 'Add New Product'}</h2>
                        {error && <div className="text-red-600 bg-red-50 p-3 rounded mb-4 text-sm">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="text-sm font-semibold">SKU</label><input required className="w-full mt-1 px-3 py-2 border rounded" value={productForm.sku} onChange={e=>setProductForm({...productForm, sku: e.target.value})} /></div>
                            <div><label className="text-sm font-semibold">Product Name</label><input required className="w-full mt-1 px-3 py-2 border rounded" value={productForm.name} onChange={e=>setProductForm({...productForm, name: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm font-semibold">Unit Type</label><input required className="w-full mt-1 px-3 py-2 border rounded" value={productForm.unit} onChange={e=>setProductForm({...productForm, unit: e.target.value})} placeholder="Box" /></div>
                                {!editMode && (
                                    <div><label className="text-sm font-semibold">Starting Stock</label><input type="number" min="0" required className="w-full mt-1 px-3 py-2 border rounded" value={productForm.initialQuantity} onChange={e=>setProductForm({...productForm, initialQuantity: e.target.value})} /></div>
                                )}
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-brand text-white rounded hover:bg-brandLight">{actionLoading ? 'Saving...' : 'Save Product'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
