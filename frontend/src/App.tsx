import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { homePathByRole } from './lib/constants';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/admin/DashboardPage';
import { AdminOrdersPage } from './pages/admin/OrdersPage';
import { AdminOrderDetailPage } from './pages/admin/OrderDetailPage';
import { AdminProductsPage } from './pages/admin/ProductsPage';
import { AdminRechargeRecordsPage } from './pages/admin/RechargeRecordsPage';
import { AdminRechargeRequestsPage } from './pages/admin/RechargeRequestsPage';
import { AdminSettlementsPage } from './pages/admin/SettlementsPage';
import { AdminUsersPage } from './pages/admin/UsersPage';
import { AdminWorkersPage } from './pages/admin/WorkersPage';
import { CustomerDashboardPage } from './pages/customer/DashboardPage';
import { CustomerOrderDetailPage } from './pages/customer/OrderDetailPage';
import { CustomerOrdersPage } from './pages/customer/OrdersPage';
import { CustomerProductsPage } from './pages/customer/ProductsPage';
import { CustomerRechargeRecordsPage } from './pages/customer/RechargeRecordsPage';
import { CustomerRechargeRequestPage } from './pages/customer/RechargeRequestPage';
import { CustomerCreateOrderPage } from './pages/customer/CreateOrderPage';
import { WorkerDashboardPage } from './pages/worker/DashboardPage';
import { WorkerOrderDetailPage } from './pages/worker/OrderDetailPage';
import { WorkerOrdersPage } from './pages/worker/OrdersPage';
import { WorkerSettlementsPage } from './pages/worker/SettlementsPage';

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={homePathByRole[user.role]} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<AppShell />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/recharges" element={<AdminRechargeRequestsPage />} />
          <Route path="/admin/recharge-records" element={<AdminRechargeRecordsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/workers" element={<AdminWorkersPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="/admin/settlements" element={<AdminSettlementsPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['worker']} />}>
        <Route element={<AppShell />}>
          <Route path="/worker/dashboard" element={<WorkerDashboardPage />} />
          <Route path="/worker/orders" element={<WorkerOrdersPage />} />
          <Route path="/worker/orders/:id" element={<WorkerOrderDetailPage />} />
          <Route path="/worker/settlements" element={<WorkerSettlementsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['customer']} />}>
        <Route element={<AppShell />}>
          <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
          <Route path="/customer/recharge" element={<CustomerRechargeRequestPage />} />
          <Route path="/customer/recharge-records" element={<CustomerRechargeRecordsPage />} />
          <Route path="/customer/products" element={<CustomerProductsPage />} />
          <Route path="/customer/orders/new" element={<CustomerCreateOrderPage />} />
          <Route path="/customer/orders" element={<CustomerOrdersPage />} />
          <Route path="/customer/orders/:id" element={<CustomerOrderDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
