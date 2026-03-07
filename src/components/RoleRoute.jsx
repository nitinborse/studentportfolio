import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function RoleRoute({ children, allowedRoles }) {
  const { role, loading } = useAuth()

  if (loading) return <p>Loading...</p>
  if (!allowedRoles.includes(role)) return <Navigate to="/" />

  return children
}