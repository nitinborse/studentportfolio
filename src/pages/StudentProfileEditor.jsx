import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  fetchStudentEditorData,
  saveStudentProfileStructured,
  uploadStudentFile,
} from "../services/adminApi";
import { useAuth } from "../context/AuthContext";
import "./StudentProfileEditor.css";

const DEFAULT_THEMES = ["Robotics", "Web Developer", "Sports", "Science", "Arts"];
const LIST_LIMITS = {
  coreSkills: 4,
  awards: 20,
  certificates: 20,
  resultsLast4: 4,
  classroomImages: 5,
  personalImages: 5,
  videoGallery: 5,
};

const EMPTY_PROFILE = {
  theme: "",
  profilePhoto: "",
  firstName: "",
  middleName: "",
  lastName: "",
  className: "",
  section: "",
  coreSkills: [],
  location: "",
  homeAddress: "",
  awards: [],
  certificates: [],
  mobile: "",
  email: "",
  schoolName: "",
  classroomImages: [],
  personalImages: [],
  videoGallery: [],
  testimonial: "",
  testimonials: [],
  resultsLast4: [],
};

function normalizeList(values, max) {
  return (values || [])
    .map((v) => (v || "").trim())
    .filter(Boolean)
    .slice(0, max);
}

function commaToList(value, max) {
  return normalizeList((value || "").split(","), max);
}

function listToComma(list) {
  return (list || []).join(", ");
}

function buildListInputState(data) {
  return {
    coreSkills: listToComma(data.coreSkills),
    awards: listToComma(data.awards),
    certificates: listToComma(data.certificates),
    resultsLast4: listToComma(data.resultsLast4),
    classroomImages: listToComma(data.classroomImages),
    personalImages: listToComma(data.personalImages),
    videoGallery: listToComma(data.videoGallery),
  };
}

function asList(value, max) {
  if (Array.isArray(value)) return normalizeList(value, max);
  if (typeof value === "string") return commaToList(value, max);
  return [];
}

function newlineToList(value, max) {
  return normalizeList(String(value || "").split(/\r?\n/), max);
}

function listToLines(list) {
  return (list || []).join("\n");
}

function splitFullName(fullName) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", middleName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], middleName: "", lastName: "" };
  if (parts.length === 2) return { firstName: parts[0], middleName: "", lastName: parts[1] };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function normalizeProfileData(studentRow, raw) {
  const src = raw || {};
  const nameParts = splitFullName(studentRow?.full_name || "");
  return {
    ...EMPTY_PROFILE,
    theme: src.theme || "",
    profilePhoto: src.profilePhoto || src.profile_photo || studentRow?.profile_photo || "",
    firstName: src.firstName || src.first_name || nameParts.firstName,
    middleName: src.middleName || src.middle_name || nameParts.middleName,
    lastName: src.lastName || src.last_name || nameParts.lastName,
    className: src.className || src.class_name || studentRow?.class || "",
    section: src.section || studentRow?.section || "",
    coreSkills: asList(src.coreSkills ?? src.core_skills, 4),
    location: src.location || "",
    homeAddress: src.homeAddress || src.home_address || "",
    awards: asList(src.awards, 20),
    certificates: asList(src.certificates, 20),
    mobile: src.mobile || src.phone || "",
    email: src.email || "",
    schoolName: src.schoolName || src.school_name || "",
    classroomImages: asList(src.classroomImages ?? src.classroom_images, 5),
    personalImages: asList(src.personalImages ?? src.personal_images, 5),
    videoGallery: asList(src.videoGallery ?? src.video_gallery, 5),
    testimonial: src.testimonial || "",
    resultsLast4: asList(src.resultsLast4 ?? src.results_last_4 ?? src.results, 4),
    testimonials: asList(src.testimonials, 20),
  };
}

export default function StudentProfileEditor() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [themes, setThemes] = useState(DEFAULT_THEMES);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [listInputs, setListInputs] = useState(buildListInputState(EMPTY_PROFILE));
  const [testimonialsInput, setTestimonialsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const slug = useMemo(
    () =>
      ((student?.slug || student?.full_name || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")) || "",
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [student?.slug, student?.full_name]
  );

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const data = await fetchStudentEditorData(studentId);
        if (!alive) return;
        setStudent(data.student);
        if (data.themes?.length) setThemes(data.themes.map((t) => t.name));

        const merged = {
          ...(data.profile?.profile_data || {}),
          className: (data.profile?.profile_data || {}).className || data.student?.class || "",
          section: (data.profile?.profile_data || {}).section || data.student?.section || "",
          profilePhoto:
            (data.profile?.profile_data || {}).profilePhoto ||
            data.student?.profile_photo ||
            "",
          theme:
            (data.profile?.profile_data || {}).theme ||
            (data.themes || []).find((t) => t.id === data.portfolio?.theme_id)?.name ||
            "",
          coreSkills:
            (data.profile?.profile_data || {}).coreSkills ||
            String(data.portfolio?.core_skills || "")
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
          awards:
            (data.profile?.profile_data || {}).awards ||
            (data.achievements || []).filter((a) => a.description === "award").map((a) => a.title),
          certificates:
            (data.profile?.profile_data || {}).certificates ||
            (data.achievements || []).filter((a) => a.description !== "award").map((a) => a.title),
          classroomImages:
            (data.profile?.profile_data || {}).classroomImages ||
            (data.media || []).filter((m) => m.type === "image" && m.category === "classroom").map((m) => m.url),
          personalImages:
            (data.profile?.profile_data || {}).personalImages ||
            (data.media || []).filter((m) => m.type === "image" && m.category === "personal").map((m) => m.url),
          videoGallery:
            (data.profile?.profile_data || {}).videoGallery ||
            (data.media || []).filter((m) => m.type === "video").map((m) => m.url),
          testimonial:
            (data.profile?.profile_data || {}).testimonial || data.testimonials?.[0]?.message || "",
          resultsLast4:
            (data.profile?.profile_data || {}).resultsLast4 ||
            (data.results || [])
              .map((r) => r.grade || (r.marks != null ? `${r.marks}%` : ""))
              .filter(Boolean)
              .slice(0, 4),
        };

        const normalized = normalizeProfileData(data.student, merged);
        const testimonialList = normalizeList(
          normalized.testimonials?.length
            ? normalized.testimonials
            : normalized.testimonial
              ? [normalized.testimonial]
              : data.testimonials?.map((t) => t.message) || [],
          20
        );
        const finalProfile = {
          ...normalized,
          testimonial: testimonialList[0] || normalized.testimonial || "",
          testimonials: testimonialList,
        };
        setProfile(finalProfile);
        setListInputs(buildListInputState(finalProfile));
        setTestimonialsInput(listToLines(testimonialList));
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load student profile editor.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [studentId]);

  function setField(key, value) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function setListFieldText(key, value) {
    setListInputs((prev) => ({ ...prev, [key]: value }));
  }

  function commitListField(key) {
    const max = LIST_LIMITS[key];
    if (!max) return;
    const parsed = commaToList(listInputs[key], max);
    setField(key, parsed);
    setListFieldText(key, listToComma(parsed));
  }

  async function handleUpload(bucket, files, fieldKey, max) {
    if (!files?.length) return;
    setUploading(true);
    setErr("");
    try {
      const existing = profile[fieldKey];
      const current = Array.isArray(existing)
        ? normalizeList(existing, max)
        : normalizeList(existing ? [existing] : [], max);
      const remaining = Math.max(0, max - current.length);
      const selected = Array.from(files).slice(0, remaining);
      const uploaded = [];
      for (const file of selected) {
        const res = await uploadStudentFile({
          bucket,
          studentId,
          file,
          folder: fieldKey,
        });
        if (res?.url) uploaded.push(res.url);
      }
      const merged = normalizeList([...current, ...uploaded], max);
      setField(fieldKey, max === 1 ? (merged[0] || "") : merged);
      if (max > 1 && LIST_LIMITS[fieldKey]) {
        setListFieldText(fieldKey, listToComma(merged));
      }
    } catch (e) {
      setErr(e.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e?.preventDefault?.();
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      const clean = {
        ...profile,
        coreSkills: commaToList(listInputs.coreSkills, 4),
        awards: commaToList(listInputs.awards, 20),
        certificates: commaToList(listInputs.certificates, 20),
        classroomImages: commaToList(listInputs.classroomImages, 5),
        personalImages: commaToList(listInputs.personalImages, 5),
        videoGallery: commaToList(listInputs.videoGallery, 5),
        resultsLast4: commaToList(listInputs.resultsLast4, 4),
        testimonials: newlineToList(testimonialsInput, 20),
      };
      clean.testimonial = clean.testimonials[0] || "";
      setProfile((prev) => ({ ...prev, ...clean }));
      setListInputs(buildListInputState(clean));
      setTestimonialsInput(listToLines(clean.testimonials));
      await saveStudentProfileStructured(studentId, clean);
      setMsg("Profile updated and stored in database tables.");
    } catch (e2) {
      setErr(e2.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading editor...</div>;
  if (err && !student) return <div style={{ padding: 20, color: "red" }}>{err}</div>;

  return (
    <div className="spe-page">
      <div className="spe-wrap">
        <div className="spe-header">
          <h2>Student Profile Editor</h2>
          <div className="spe-meta">
            <span className="spe-chip">Student: {student?.full_name}</span>
            <span className="spe-chip">School: {student?.school_id || "-"}</span>
            <span className="spe-chip"><Link to="/teacher" className="spe-link">Back to Dashboard</Link></span>
            <button className="ui-btn danger" onClick={async () => { await logout(); navigate("/login"); }} style={{padding: "6px 12px", fontSize: "13px"}}>Logout</button>
            {slug && (
              <span className="spe-chip">
                Public URL:{" "}
                <a href={`/${slug}`} target="_blank" rel="noreferrer" className="spe-link">
                  {window.location.origin}/{slug}
                </a>
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="spe-layout">
          <div className="spe-card">
            <h3>Basic Details</h3>
            <div className="spe-field">
              <label>Theme</label>
              <select value={profile.theme || ""} onChange={(e) => setField("theme", e.target.value)}>
                <option value="">Select theme</option>
                {themes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="spe-field" style={{ marginTop: 10 }}>
              <label>Profile Picture URL</label>
              <input value={profile.profilePhoto || ""} onChange={(e) => setField("profilePhoto", e.target.value)} />
              <div className="spe-upload">
                <input type="file" accept="image/*" onChange={(e) => handleUpload("student-photos", e.target.files, "profilePhoto", 1)} />
              </div>
            </div>
            <div className="spe-grid-3" style={{ marginTop: 10 }}>
              <div className="spe-field">
                <label>First Name</label>
                <input value={profile.firstName || ""} onChange={(e) => setField("firstName", e.target.value)} />
              </div>
              <div className="spe-field">
                <label>Middle Name</label>
                <input value={profile.middleName || ""} onChange={(e) => setField("middleName", e.target.value)} />
              </div>
              <div className="spe-field">
                <label>Last Name</label>
                <input value={profile.lastName || ""} onChange={(e) => setField("lastName", e.target.value)} />
              </div>
            </div>
            <div className="spe-grid-2" style={{ marginTop: 10 }}>
              <div className="spe-field">
                <label>Class</label>
                <input value={profile.className || ""} onChange={(e) => setField("className", e.target.value)} />
              </div>
              <div className="spe-field">
                <label>Section</label>
                <input value={profile.section || ""} onChange={(e) => setField("section", e.target.value)} />
              </div>
            </div>
            <div className="spe-field" style={{ marginTop: 10 }}>
              <label>Core Skills (max 4, comma separated)</label>
              <input
                value={listInputs.coreSkills}
                onChange={(e) => setListFieldText("coreSkills", e.target.value)}
                onBlur={() => commitListField("coreSkills")}
              />
            </div>
          </div>

          <div className="spe-card">
            <h3>Contact & Address</h3>
            <div className="spe-grid-3">
              <div className="spe-field">
                <label>Mobile</label>
                <input value={profile.mobile || ""} onChange={(e) => setField("mobile", e.target.value)} />
              </div>
              <div className="spe-field">
                <label>Email</label>
                <input value={profile.email || ""} onChange={(e) => setField("email", e.target.value)} />
              </div>
              <div className="spe-field">
                <label>School Name</label>
                <input value={profile.schoolName || ""} onChange={(e) => setField("schoolName", e.target.value)} />
              </div>
            </div>
            <div className="spe-field" style={{ marginTop: 10 }}>
              <label>Location</label>
              <input value={profile.location || ""} onChange={(e) => setField("location", e.target.value)} />
            </div>
            <div className="spe-field" style={{ marginTop: 10 }}>
              <label>Home Address</label>
              <textarea value={profile.homeAddress || ""} onChange={(e) => setField("homeAddress", e.target.value)} rows={3} />
            </div>
          </div>

          <div className="spe-card">
            <h3>Achievements</h3>
            <div className="spe-field">
              <label>Awards (comma separated)</label>
              <textarea
                value={listInputs.awards}
                onChange={(e) => setListFieldText("awards", e.target.value)}
                onBlur={() => commitListField("awards")}
                rows={3}
              />
            </div>
            <div className="spe-field" style={{ marginTop: 10 }}>
              <label>Certificates (comma separated)</label>
              <textarea
                value={listInputs.certificates}
                onChange={(e) => setListFieldText("certificates", e.target.value)}
                onBlur={() => commitListField("certificates")}
                rows={3}
              />
            </div>
            <div className="spe-field" style={{ marginTop: 10 }}>
              <label>Results Last 4 (comma separated)</label>
              <textarea
                value={listInputs.resultsLast4}
                onChange={(e) => setListFieldText("resultsLast4", e.target.value)}
                onBlur={() => commitListField("resultsLast4")}
                rows={2}
              />
            </div>
            <div className="spe-field" style={{ marginTop: 10 }}>
              <label>Testimonials (one per line)</label>
              <textarea
                value={testimonialsInput}
                onChange={(e) => setTestimonialsInput(e.target.value)}
                onBlur={() => setTestimonialsInput(listToLines(newlineToList(testimonialsInput, 20)))}
                rows={4}
              />
            </div>
          </div>

          <div className="spe-card">
            <h3>Media Gallery</h3>
            <div className="spe-field">
              <label>Classroom Images URLs (max 5)</label>
              <textarea
                value={listInputs.classroomImages}
                onChange={(e) => setListFieldText("classroomImages", e.target.value)}
                onBlur={() => commitListField("classroomImages")}
                rows={2}
              />
              <div className="spe-upload">
                <input type="file" accept="image/*" multiple onChange={(e) => handleUpload("galleries", e.target.files, "classroomImages", 5)} />
              </div>
            </div>
            <div className="spe-field" style={{ marginTop: 10 }}>
              <label>Personal Images URLs (max 5)</label>
              <textarea
                value={listInputs.personalImages}
                onChange={(e) => setListFieldText("personalImages", e.target.value)}
                onBlur={() => commitListField("personalImages")}
                rows={2}
              />
              <div className="spe-upload">
                <input type="file" accept="image/*" multiple onChange={(e) => handleUpload("student-photos", e.target.files, "personalImages", 5)} />
              </div>
            </div>
            <div className="spe-field" style={{ marginTop: 10 }}>
              <label>Video Gallery URLs (max 5)</label>
              <textarea
                value={listInputs.videoGallery}
                onChange={(e) => setListFieldText("videoGallery", e.target.value)}
                onBlur={() => commitListField("videoGallery")}
                rows={2}
              />
              <div className="spe-upload">
                <input type="file" accept="video/*" multiple onChange={(e) => handleUpload("videos", e.target.files, "videoGallery", 5)} />
              </div>
            </div>
          </div>
        </form>

        {msg && <p className="spe-msg ok">{msg}</p>}
        {err && <p className="spe-msg err">{err}</p>}
      </div>

      <div className="spe-actions">
        <div className="spe-actions-inner">
          <span>{uploading ? "Uploading files..." : "Ready to save profile changes."}</span>
          <button type="button" className="spe-save" onClick={handleSave} disabled={saving || uploading}>
            {saving ? "Saving..." : uploading ? "Uploading..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
