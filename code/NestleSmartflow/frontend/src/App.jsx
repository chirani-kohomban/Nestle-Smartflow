import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import NestleManagerDashboard from './pages/NestleManagerDashboard';
import AreaManagerDashboard from './pages/AreaManagerDashboard';
import WarehouseDashboard from './pages/WarehouseDashboard';
import DistributorDashboard from './pages/DistributorDashboard';
import RetailerDashboard from './pages/RetailerDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/nestle-manager" element={<NestleManagerDashboard />} />
        <Route path="/area-manager" element={<AreaManagerDashboard />} />
        <Route path="/warehouse" element={<WarehouseDashboard />} />
        <Route path="/distributor" element={<DistributorDashboard />} />
        <Route path="/retailer" element={<RetailerDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
