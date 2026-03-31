import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  fetchStudentEditorData,
  saveStudentProfileStructured,
  uploadStudentFile,
} from "../services/adminApi";
import { useAuth } from "../context/AuthContext";
import "./StudentProfileEditor.css";

const DEFAULT_THEMES = [
  "Robotics",
  "Web Developer",
  "Data Science",
  "Sports",
  "Music",
  "Art & Design",
  "Photography",
  "Gaming",
  "Dance",
  "Culinary Arts",
  "Fashion",
  "Film & Cinema",
  "Environment",
  "Space & Astronomy",
  "Literature",
  "Business"
];
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

function convertToEmbedUrl(url) {
  if (!url) return url;
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
  const match = url.match(youtubeRegex);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
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
  const { profile: authProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [themes, setThemes] = useState(DEFAULT_THEMES);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [listInputs, setListInputs] = useState(buildListInputState(EMPTY_PROFILE));
  const [testimonialsInput, setTestimonialsInput] = useState("");
  const [previewImages, setPreviewImages] = useState({ profilePhoto: "", classroomImages: [], personalImages: [] });
  const [previewVideos, setPreviewVideos] = useState([]);
  const [previewResults, setPreviewResults] = useState([]);
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

  const dashboardPath = useMemo(() => {
    if (authProfile?.role === "super_admin") return "/super-admin";
    if (authProfile?.role === "admin") return "/admin";
    return "/teacher";
  }, [authProfile?.role]);

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
        setPreviewImages({
          profilePhoto: finalProfile.profilePhoto || "",
          classroomImages: finalProfile.classroomImages || [],
          personalImages: finalProfile.personalImages || []
        });
        setPreviewVideos(finalProfile.videoGallery || []);
        setPreviewResults(finalProfile.resultsLast4 || []);
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
          bucket: bucket === "results" ? "student-photos" : bucket,
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
      if (fieldKey === "profilePhoto") {
        setPreviewImages(prev => ({ ...prev, profilePhoto: merged[0] || "" }));
      } else if (fieldKey === "classroomImages") {
        setPreviewImages(prev => ({ ...prev, classroomImages: merged }));
      } else if (fieldKey === "personalImages") {
        setPreviewImages(prev => ({ ...prev, personalImages: merged }));
      } else if (fieldKey === "videoGallery") {
        setPreviewVideos(merged);
      } else if (fieldKey === "resultsLast4") {
        setPreviewResults(merged);
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
        coreSkills: (profile.coreSkills || []).filter(Boolean),
        awards: (profile.awards || []).filter(Boolean),
        certificates: (profile.certificates || []).filter(Boolean),
        classroomImages: (profile.classroomImages || []).filter(Boolean),
        personalImages: (profile.personalImages || []).filter(Boolean),
        videoGallery: (profile.videoGallery || []).filter(Boolean),
        resultsLast4: (profile.resultsLast4 || []).filter(Boolean),
        testimonials: (profile.testimonials || []).filter(Boolean),
      };
      clean.testimonial = clean.testimonials[0] || "";
      setProfile((prev) => ({ ...prev, ...clean }));
      setListInputs(buildListInputState(clean));
      setTestimonialsInput(listToLines(clean.testimonials));
      
      const result = await saveStudentProfileStructured(studentId, clean);
      
      // Update slug if name changed
      const newSlug = result?.student?.slug || 
        [clean.firstName, clean.middleName, clean.lastName]
          .filter(Boolean)
          .join("-")
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "");
      
      if (newSlug && student?.slug !== newSlug) {
        setStudent((prev) => ({ ...prev, slug: newSlug }));
      }
      
      setMsg("Profile updated and stored in database tables.");
    } catch (e2) {
      setErr(e2.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="ui-center">
        <div className="ui-card" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <h3>Loading editor...</h3>
          <p style={{ color: "#64748b" }}>Preparing student profile data.</p>
        </div>
      </div>
    );
  }

  if (err && !student) {
    return (
      <div className="ui-center">
        <div className="ui-card" style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
          <h3>Unable to load editor</h3>
          <p className="ui-msg err">{err}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spe-page">
      <div className="spe-wrap">
        <div className="spe-header">
          <h2>Student Profile Editor</h2>
          <div className="spe-meta">
            <span className="spe-chip">Student: {student?.full_name}</span>
            <span className="spe-chip">School: {student?.school_id || "-"}</span>
            <span className="spe-chip"><Link to={dashboardPath} className="spe-link">Back to Dashboard</Link></span>
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

        <form onSubmit={handleSave} className="spe-form">
          <div className="spe-card">
            <div className="spe-field">
              <label>Theme</label>
              <select value={profile.theme || ""} onChange={(e) => setField("theme", e.target.value)}>
                <option value="">Select theme</option>
                {themes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="spe-profile-section">
              <div className="spe-field">
                <label>Profile Picture</label>
                {!previewImages.profilePhoto ? (
                  <>
                    <input value={profile.profilePhoto || ""} onChange={(e) => { setField("profilePhoto", e.target.value); setPreviewImages(prev => ({ ...prev, profilePhoto: e.target.value })); }} placeholder="Enter image URL" />
                    <div className="spe-upload">
                      <input type="file" accept="image/*" onChange={(e) => handleUpload("student-photos", e.target.files, "profilePhoto", 1)} />
                    </div>
                  </>
                ) : (
                  <div className="spe-profile-preview">
                    <img src={previewImages.profilePhoto} alt="Profile" onError={(e) => e.target.style.display = 'none'} />
                    <button type="button" className="spe-media-remove" onClick={() => { setField("profilePhoto", ""); setPreviewImages(prev => ({ ...prev, profilePhoto: "" })); }}>&times;</button>
                  </div>
                )}
              </div>

              <div className="spe-name-fields">
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
            </div>

            <div className="spe-row">
              <div className="spe-field">
                <label>Class</label>
                <input value={profile.className || ""} onChange={(e) => setField("className", e.target.value)} />
              </div>
              <div className="spe-field">
                <label>Section</label>
                <input value={profile.section || ""} onChange={(e) => setField("section", e.target.value)} />
              </div>
            </div>

            <div className="spe-field">
              <label>Core Skills (max 4)</label>
              <div className="spe-grid-2x2">
                {(profile.coreSkills || []).map((skill, i) => (
                  <div key={i} className="spe-list-item">
                    <input value={skill} onChange={(e) => {
                      const updated = [...profile.coreSkills];
                      updated[i] = e.target.value;
                      setField("coreSkills", updated);
                    }} placeholder={`Skill ${i + 1}`} />
                    <button type="button" className="spe-remove" onClick={() => setField("coreSkills", profile.coreSkills.filter((_, idx) => idx !== i))}>&times;</button>
                  </div>
                ))}
              </div>
              {(profile.coreSkills?.length || 0) < 4 && (
                <button type="button" className="spe-add" onClick={() => setField("coreSkills", [...(profile.coreSkills || []), ""])}>+ Add Skill</button>
              )}
            </div>

            <div className="spe-row">
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

            <div className="spe-field">
              <label>Location</label>
              <input value={profile.location || ""} onChange={(e) => setField("location", e.target.value)} />
            </div>

            <div className="spe-field">
              <label>Home Address</label>
              <textarea value={profile.homeAddress || ""} onChange={(e) => setField("homeAddress", e.target.value)} rows={3} />
            </div>

            <div className="spe-field">
              <label>Awards (max 20)</label>
              <div className="spe-grid-2x2">
                {(profile.awards || []).map((award, i) => (
                  <div key={i} className="spe-list-item">
                    <input value={award} onChange={(e) => {
                      const updated = [...profile.awards];
                      updated[i] = e.target.value;
                      setField("awards", updated);
                    }} placeholder={`Award ${i + 1}`} />
                    <button type="button" className="spe-remove" onClick={() => setField("awards", profile.awards.filter((_, idx) => idx !== i))}>&times;</button>
                  </div>
                ))}
              </div>
              {(profile.awards?.length || 0) < 20 && (
                <button type="button" className="spe-add" onClick={() => setField("awards", [...(profile.awards || []), ""])}>+ Add Award</button>
              )}
            </div>

            <div className="spe-field">
              <label>Certificates (max 20)</label>
              <div className="spe-grid-2x2">
                {(profile.certificates || []).map((cert, i) => (
                  <div key={i} className="spe-list-item">
                    <input value={cert} onChange={(e) => {
                      const updated = [...profile.certificates];
                      updated[i] = e.target.value;
                      setField("certificates", updated);
                    }} placeholder={`Certificate ${i + 1}`} />
                    <button type="button" className="spe-remove" onClick={() => setField("certificates", profile.certificates.filter((_, idx) => idx !== i))}>&times;</button>
                  </div>
                ))}
              </div>
              {(profile.certificates?.length || 0) < 20 && (
                <button type="button" className="spe-add" onClick={() => setField("certificates", [...(profile.certificates || []), ""])}>+ Add Certificate</button>
              )}
            </div>

            <div className="spe-field">
              <label>Results Last 4 (PDF)</label>
              <div className="spe-media-grid">
                {(previewResults || []).map((pdf, i) => (
                  <div key={i} className="spe-media-preview">
                    <iframe src={pdf} frameBorder="0" title={`Result ${i + 1}`} />
                    <button type="button" className="spe-media-remove" onClick={() => {
                      const updated = profile.resultsLast4.filter((_, idx) => idx !== i);
                      setField("resultsLast4", updated);
                      setPreviewResults(updated);
                    }}>&times;</button>
                  </div>
                ))}
              </div>
              {(profile.resultsLast4?.length || 0) < 4 && (
                <>
                  <input value="" onChange={(e) => {
                    if (e.target.value) {
                      const updated = [...(profile.resultsLast4 || []), e.target.value];
                      setField("resultsLast4", updated);
                      setPreviewResults(updated);
                      e.target.value = "";
                    }
                  }} placeholder="Enter PDF URL and press Enter" onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      const updated = [...(profile.resultsLast4 || []), e.target.value];
                      setField("resultsLast4", updated);
                      setPreviewResults(updated);
                      e.target.value = "";
                    }
                  }} />
                  <div className="spe-upload">
                    <input type="file" accept=".pdf" multiple onChange={(e) => handleUpload("results", e.target.files, "resultsLast4", 4)} />
                  </div>
                </>
              )}
            </div>

            <div className="spe-field">
              <label>Testimonials (max 20)</label>
              <div className="spe-grid-2x2">
                {(profile.testimonials || []).map((test, i) => (
                  <div key={i} className="spe-list-item">
                    <textarea value={test} onChange={(e) => {
                      const updated = [...profile.testimonials];
                      updated[i] = e.target.value;
                      setField("testimonials", updated);
                      if (i === 0) setField("testimonial", e.target.value);
                    }} placeholder={`Testimonial ${i + 1}`} rows={2} />
                    <button type="button" className="spe-remove" onClick={() => {
                      const updated = profile.testimonials.filter((_, idx) => idx !== i);
                      setField("testimonials", updated);
                      if (i === 0) setField("testimonial", updated[0] || "");
                    }}>&times;</button>
                  </div>
                ))}
              </div>
              {(profile.testimonials?.length || 0) < 20 && (
                <button type="button" className="spe-add" onClick={() => setField("testimonials", [...(profile.testimonials || []), ""])}>+ Add Testimonial</button>
              )}
            </div>

            <div className="spe-field">
              <label>Classroom Images (max 5)</label>
              <div className="spe-media-grid">
                {(previewImages.classroomImages || []).map((img, i) => (
                  <div key={i} className="spe-media-preview">
                    <img src={img} alt={`Classroom ${i + 1}`} onError={(e) => e.target.style.display = 'none'} />
                    <button type="button" className="spe-media-remove" onClick={() => {
                      const updated = profile.classroomImages.filter((_, idx) => idx !== i);
                      setField("classroomImages", updated);
                      setPreviewImages(prev => ({ ...prev, classroomImages: updated }));
                    }}>&times;</button>
                  </div>
                ))}
              </div>
              {(profile.classroomImages?.length || 0) < 5 && (
                <>
                  <input value="" onChange={(e) => {
                    if (e.target.value) {
                      const updated = [...(profile.classroomImages || []), e.target.value];
                      setField("classroomImages", updated);
                      setPreviewImages(prev => ({ ...prev, classroomImages: updated }));
                      e.target.value = "";
                    }
                  }} placeholder="Enter image URL and press Enter" onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      const updated = [...(profile.classroomImages || []), e.target.value];
                      setField("classroomImages", updated);
                      setPreviewImages(prev => ({ ...prev, classroomImages: updated }));
                      e.target.value = "";
                    }
                  }} />
                  <div className="spe-upload">
                    <input type="file" accept="image/*" multiple onChange={(e) => handleUpload("galleries", e.target.files, "classroomImages", 5)} />
                  </div>
                </>
              )}
            </div>

            <div className="spe-field">
              <label>Personal Images (max 5)</label>
              <div className="spe-media-grid">
                {(previewImages.personalImages || []).map((img, i) => (
                  <div key={i} className="spe-media-preview">
                    <img src={img} alt={`Personal ${i + 1}`} onError={(e) => e.target.style.display = 'none'} />
                    <button type="button" className="spe-media-remove" onClick={() => {
                      const updated = profile.personalImages.filter((_, idx) => idx !== i);
                      setField("personalImages", updated);
                      setPreviewImages(prev => ({ ...prev, personalImages: updated }));
                    }}>&times;</button>
                  </div>
                ))}
              </div>
              {(profile.personalImages?.length || 0) < 5 && (
                <>
                  <input value="" onChange={(e) => {
                    if (e.target.value) {
                      const updated = [...(profile.personalImages || []), e.target.value];
                      setField("personalImages", updated);
                      setPreviewImages(prev => ({ ...prev, personalImages: updated }));
                      e.target.value = "";
                    }
                  }} placeholder="Enter image URL and press Enter" onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      const updated = [...(profile.personalImages || []), e.target.value];
                      setField("personalImages", updated);
                      setPreviewImages(prev => ({ ...prev, personalImages: updated }));
                      e.target.value = "";
                    }
                  }} />
                  <div className="spe-upload">
                    <input type="file" accept="image/*" multiple onChange={(e) => handleUpload("student-photos", e.target.files, "personalImages", 5)} />
                  </div>
                </>
              )}
            </div>

            <div className="spe-field">
              <label>Video Gallery (max 5)</label>
              <div className="spe-media-grid">
                {(previewVideos || []).map((vid, i) => (
                  <div key={i} className="spe-media-preview">
                    <iframe src={convertToEmbedUrl(vid)} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    <button type="button" className="spe-media-remove" onClick={() => {
                      const updated = profile.videoGallery.filter((_, idx) => idx !== i);
                      setField("videoGallery", updated);
                      setPreviewVideos(updated);
                    }}>&times;</button>
                  </div>
                ))}
              </div>
              {(profile.videoGallery?.length || 0) < 5 && (
                <>
                  <input value="" onChange={(e) => {
                    if (e.target.value) {
                      const updated = [...(profile.videoGallery || []), e.target.value];
                      setField("videoGallery", updated);
                      setPreviewVideos(updated);
                      e.target.value = "";
                    }
                  }} placeholder="Enter YouTube or video URL and press Enter" onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      const updated = [...(profile.videoGallery || []), e.target.value];
                      setField("videoGallery", updated);
                      setPreviewVideos(updated);
                      e.target.value = "";
                    }
                  }} />
                  <div className="spe-upload">
                    <input type="file" accept="video/*" multiple onChange={(e) => handleUpload("videos", e.target.files, "videoGallery", 5)} />
                  </div>
                </>
              )}
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

