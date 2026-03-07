import { useAuth } from "../context/AuthContext";

export default function TeacherDashboard() {
  const { profile, logout } = useAuth();

  return (
    <div style={{ padding: 20 }}>
      <h2>Teacher Dashboard</h2>
      <p>Teacher: {profile?.full_name || profile?.id}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}