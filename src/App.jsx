import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import PostLogin from "./pages/PostLogin";

import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import SuperAdminUsers from "./pages/SuperAdminUsers";
import HierarchyAdminsPage from "./pages/HierarchyAdminsPage";
import HierarchyTeachersPage from "./pages/HierarchyTeachersPage";
import HierarchyStudentsPage from "./pages/HierarchyStudentsPage";
import StudentPublicProfile from "./pages/StudentPublicProfile";
import StudentProfileEditor from "./pages/StudentProfileEditor";

function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:studentName" element={<StudentPublicProfile />} />
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Navigate to="/post-login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/post-login" element={<PostLogin />} />

          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allow={["super_admin"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allow={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allow={["teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute allow={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/users"
            element={
              <ProtectedRoute allow={["super_admin"]}>
                <SuperAdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/hierarchy"
            element={
              <ProtectedRoute allow={["super_admin"]}>
                <Navigate to="/super-admin/hierarchy/admins" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/hierarchy/admins"
            element={
              <ProtectedRoute allow={["super_admin"]}>
                <HierarchyAdminsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/hierarchy/admin/:adminId/teachers"
            element={
              <ProtectedRoute allow={["super_admin"]}>
                <HierarchyTeachersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/hierarchy/teacher/:teacherId/students"
            element={
              <ProtectedRoute allow={["super_admin"]}>
                <HierarchyStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/:studentId/edit"
            element={
              <ProtectedRoute allow={["super_admin", "admin", "teacher"]}>
                <StudentProfileEditor />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* IMPORTANT: fallback should NOT show Login */}
        <Route path="*" element={<Navigate to="/post-login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
