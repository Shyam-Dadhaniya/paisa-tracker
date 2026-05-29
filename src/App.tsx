import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import EditExpense from './pages/EditExpense';
import Categories from './pages/Categories';
import History from './pages/History';
import Settings from './pages/Settings';
import SmsParser from './pages/SmsParser';
import Login from './pages/Login';
import BottomNav from './components/BottomNav';
import { useAuthStore } from './store/authStore';
import { useCategoryStore } from './store/categoryStore';

export default function App() {
  const initAuth = useAuthStore((s) => s.init);
  const loadCategories = useCategoryStore((s) => s.loadCustomCategories);
  useEffect(() => {
    initAuth();
    loadCategories();
  }, [initAuth, loadCategories]);

  return (
    <div className="min-h-full bg-bg text-text">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddExpense />} />
        <Route path="/edit/:id" element={<EditExpense />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/sms" element={<SmsParser />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
