import { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Search, ArrowUpRight, ArrowDownRight, Package, Loader2 } from 'lucide-react';

export default function WarehouseDashboard() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [stockModal, setStockModal] = useState({ show: false, type: 'IN', product: null });
    const [stockDelta, setStockDelta] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadInventory = async () => {
        try {
            const data = await fetchApi('/inventory');
            setInventory(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { loadInventory(); }, []);

    const handleStockUpdate = async (e) => {
        e.preventDefault();
        setActionLoading(true); setError(null);
        try {
            const delta = stockModal.type === 'IN' ? parseInt(stockDelta) : -parseInt(stockDelta);
            await fetchApi(`/products/${stockModal.product.id}/stock`, {
                method: 'PUT', body: JSON.stringify({ delta, movementType: stockModal.type })
            });
            setStockModal({ show: false, type: 'IN', product: null });
            setStockDelta('');
            loadInventory();
        } catch (err) { setError(err.message); } finally { setActionLoading(false); }
    };

    const filtered = inventory.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass p-6 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-brand to-brandLight bg-clip-text text-transparent">Warehouse Floor</h1>
                    <p className="text-slate-500 font-medium mt-1">Update physical stock quantities (Receive / Dispatch)</p>
                </div>
            </div>

            <div className="glass overflow-hidden">
                <div className="p-4 border-b border-white/40 bg-white/30 relative">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" placeholder="Search by SKU or item name..." 
                        className="w-full pl-10 pr-4 py-2 border rounded text-sm"
                        value={search} onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 text-sm">
                        <tr>
                            <th className="p-4">SKU</th>
                            <th className="p-4">Product Name</th>
                            <th className="p-4">Current Stock</th>
                            <th className="p-4">Last Activity</th>
                            <th className="p-4 text-right">Adjust Stock</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="p-4 font-mono text-sm font-semibold">{item.sku}</td>
                                <td className="p-4 flex items-center gap-2"><Package className="w-4 h-4 text-slate-400"/> {item.name}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-sm font-bold ${item.quantity <= 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {item.quantity} {item.unit}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-slate-500">
                                    {item.last_updated_at ? new Date(item.last_updated_at).toLocaleString() : 'Never'}
                                    <div className="text-slate-400">by {item.last_updated_by_user || 'System'}</div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setStockModal({ show: true, type: 'IN', product: item })} className="p-2 border border-green-200 text-green-600 rounded-xl hover:bg-green-50 hover:border-green-300 shadow-sm transition-all tooltip" title="Receive Stock"><ArrowUpRight className="w-5 h-5" /></button>
                                        <button onClick={() => setStockModal({ show: true, type: 'OUT', product: item })} className="p-2 border border-orange-200 text-orange-600 rounded-xl hover:bg-orange-50 hover:border-orange-300 shadow-sm transition-all tooltip" title="Dispatch Stock"><ArrowDownRight className="w-5 h-5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {stockModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-1">Stock {stockModal.type === 'IN' ? 'In (Receive)' : 'Out (Dispatch)'}</h2>
                        <p className="text-sm text-slate-500 mb-4">{stockModal.product.name} ({stockModal.product.sku})</p>
                        {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}
                        <form onSubmit={handleStockUpdate}>
                            <label className="text-sm font-medium">Quantity to {stockModal.type === 'IN' ? 'Add' : 'Remove'}</label>
                            <div className="relative mt-1">
                                <input type="number" min="1" required className="w-full pl-3 pr-12 py-2 border rounded" value={stockDelta} onChange={e=>setStockDelta(e.target.value)} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{stockModal.product.unit}</span>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setStockModal({show:false, type:'IN', product:null})} className="px-4 py-2 border rounded hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={actionLoading} className={`px-4 py-2 text-white rounded ${stockModal.type==='IN'?'bg-green-600':'bg-orange-600'}`}>{actionLoading ? 'Updating...' : 'Confirm'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
