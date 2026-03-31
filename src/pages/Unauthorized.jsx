import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="ui-center">
      <div className="ui-card" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <h2>Unauthorized</h2>
        <p style={{ color: "#64748b" }}>You do not have access to this page.</p>
        <Link to="/login" className="ui-link">Go to Login</Link>
      </div>
    </div>
  );
}
