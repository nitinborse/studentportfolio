import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { profile, logout } = useAuth();

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Dashboard</h2>
      <p>School ID: {profile?.school_id}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}