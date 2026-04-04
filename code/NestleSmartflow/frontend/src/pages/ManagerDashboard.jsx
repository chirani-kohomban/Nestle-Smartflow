import { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Search, Loader2, Download, TrendingUp, Package } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ManagerDashboard() {
    const [reports, setReports] = useState({ shipments: [], distribution: [] });
    const [loading, setLoading] = useState(true);

    const loadReports = async () => {
        try {
            const data = await fetchApi('/reports');
            setReports(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { loadReports(); }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const downloadCSV = () => {
        if (!reports.distribution.length) return;
        const headers = "Product Name,Quantity\n";
        const csvRows = reports.distribution.map(r => `${r.name},${r.quantity}`).join('\n');
        const blob = new Blob([headers + csvRows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass p-6 flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-brand to-brandLight bg-clip-text text-transparent">Analytics & Reports</h1>
                    <p className="text-slate-500 mt-1 font-medium">Real-time inventory intelligence and historical trends</p>
                </div>
                <button onClick={downloadCSV} className="relative z-10 flex items-center gap-2 bg-white border border-slate-200 shadow-sm hover:shadow text-brand px-4 py-2 rounded-xl font-semibold transition-all">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
                <div className="absolute -right-4 -bottom-10 w-32 h-32 bg-green-50 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <Package className="w-5 h-5 text-brand" /> Current Stock Distribution
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={reports.distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="quantity">
                                    {reports.distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value + ' units', name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass p-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-brand" /> Shipments Over 7 Days
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reports.shipments}>
                                <XAxis dataKey="date" tick={{fontSize: 12}} />
                                <YAxis />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="total_shipped" fill="#0A335C" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="glass p-6">
                 <h2 className="text-lg font-bold text-slate-800 mb-4">Detailed Ledger Overview</h2>
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-medium rounded-tl-xl">Product Name</th>
                            <th className="p-4 font-medium text-right rounded-tr-xl">Available Quantity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                        {reports.distribution.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-4 font-medium text-slate-700">{item.name}</td>
                                <td className="p-4 text-right">
                                    <span className="bg-brand/10 text-brand px-3 py-1 rounded-full text-sm font-bold">{item.quantity}</span>
                                </td>
                            </tr>
                        ))}
                        {reports.distribution.length === 0 && (
                            <tr><td colSpan="2" className="p-8 text-center text-slate-400">No stock available</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
