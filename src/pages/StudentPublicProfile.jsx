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

  if (loading) return <div style={{ padding: 20 }}>Loading student profile...</div>;
  if (err) return <div style={{ padding: 20, color: "red" }}>{err}</div>;
  if (!payload?.student) return <div style={{ padding: 20 }}>Student profile not found.</div>;

  const student = payload.student;
  const p = payload.profile_data || {};

  return <StudentThemeRenderer student={student} profile={p} />;
}
