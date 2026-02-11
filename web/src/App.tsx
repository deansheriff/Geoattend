import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./components/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLocations from "./pages/admin/AdminLocations";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminAssignments from "./pages/admin/AdminAssignments";
import AdminShifts from "./pages/admin/AdminShifts";
import AdminShiftOverview from "./pages/admin/AdminShiftOverview";
import AdminReports from "./pages/admin/AdminReports";
import AdminAlerts from "./pages/admin/AdminAlerts";
import AdminSettings from "./pages/admin/AdminSettings";
import EmployeeClock from "./pages/employee/EmployeeClock";
import EmployeeHistory from "./pages/employee/EmployeeHistory";
import AdminCreateOpen from "./pages/AdminCreateOpen";

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
      <Route path="/admin-create-open" element={<AdminCreateOpen />} />
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
        path="/admin/assignments"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminAssignments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shifts"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminShifts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shifts/overview"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminShiftOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/alerts"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminAlerts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminSettings />
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
