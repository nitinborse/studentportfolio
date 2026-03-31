import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicStudentProfileBySlug } from "../services/adminApi";
import StudentThemeRenderer from "../components/themes/StudentThemeRenderer";

export default function StudentPublicProfile() {
  const { studentName } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const row = await fetchPublicStudentProfileBySlug(studentName || "");
        if (!alive) return;
        setPayload(row);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load student profile.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [studentName]);

  if (loading) {
    return (
      <div className="ui-center">
        <div className="ui-card" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <h3>Loading profile...</h3>
          <p style={{ color: "#64748b" }}>Preparing the student portfolio.</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="ui-center">
        <div className="ui-card" style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
          <h3>Unable to load profile</h3>
          <p className="ui-msg err">{err}</p>
        </div>
      </div>
    );
  }

  if (!payload?.student) {
    return (
      <div className="ui-center">
        <div className="ui-card" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <h3>Profile not found</h3>
          <p style={{ color: "#64748b" }}>The requested student profile does not exist.</p>
        </div>
      </div>
    );
  }

  const student = payload.student;
  const p = payload.profile_data || {};

  return <StudentThemeRenderer student={student} profile={p} />;
}
