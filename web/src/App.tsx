import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./components/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLocations from "./pages/admin/AdminLocations";
import AdminEmployees from "./pages/admin/AdminEmployees";
import EmployeeClock from "./pages/employee/EmployeeClock";
import EmployeeHistory from "./pages/employee/EmployeeHistory";

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === "ADMIN" ? <Navigate to="/admin" replace /> : <Navigate to="/employee/clock" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleRedirect />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/locations"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminLocations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminEmployees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/clock"
        element={
          <ProtectedRoute role="EMPLOYEE">
            <EmployeeClock />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/history"
        element={
          <ProtectedRoute role="EMPLOYEE">
            <EmployeeHistory />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}