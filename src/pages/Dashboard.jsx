import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      <h2>Role: {user?.role}</h2>
      <button onClick={logout}>Logout</button>
      <div>
        {user.role === "super_admin" && <p>Super Admin Panel</p>}
        {user.role === "admin" && <p>Admin Panel</p>}
        {user.role === "teacher" && <p>Teacher Panel</p>}
        {user.role === "student" && <p>Student Panel</p>}
      </div>
    </div>
  );
}