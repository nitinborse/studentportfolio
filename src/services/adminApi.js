import { supabase } from "./supabase";

export async function createSchool(schoolName) {
  const slug = schoolName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  const { data, error } = await supabase
    .from('schools')
    .insert({ name: schoolName, slug })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createUser({ email, password, full_name, role, school_id }) {
  const payload = { email, password, full_name, role, school_id };

  const { data, error } = await supabase.functions.invoke("create-user", {
    body: payload,
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(error.message || "Failed to create user");
  }

  if (data?.error) {
    console.error('Edge function returned error:', data.error);
    throw new Error(data.error);
  }

  if (!data?.ok) {
    console.error('Edge function response:', data);
    throw new Error(data?.message || "User creation failed");
  }

  return data;
}

export async function bulkCreateStudents({ students, school_id, teacher_id }) {
  const rows = students.map(s => ({
    full_name: s.full_name,
    school_id,
    teacher_id,
    slug: slugFromName(s.full_name),
    class: s.class || null,
    section: s.section || null
  }));
  
  const { data, error } = await supabase
    .from("students")
    .insert(rows)
    .select("id, full_name, school_id, slug, class, section, created_at");
  
  if (error) throw error;
  
  const created = data || [];
  for (let i = 0; i < created.length; i++) {
    const student = created[i];
    const profile = students[i];
    if (!profile) continue;
    
    const profileData = {
      theme: profile.theme || "",
      firstName: profile.firstName || "",
      middleName: profile.middleName || "",
      lastName: profile.lastName || "",
      className: profile.class || "",
      section: profile.section || "",
      coreSkills: profile.coreSkills ? profile.coreSkills.split(";").map(s => s.trim()).filter(Boolean) : [],
      location: profile.location || "",
      homeAddress: profile.homeAddress || "",
      awards: profile.awards ? profile.awards.split(";").map(s => s.trim()).filter(Boolean) : [],
      certificates: profile.certificates ? profile.certificates.split(";").map(s => s.trim()).filter(Boolean) : [],
      mobile: profile.mobile || "",
      email: profile.email || "",
      schoolName: profile.schoolName || "",
      testimonials: profile.testimonials ? profile.testimonials.split(";").map(s => s.trim()).filter(Boolean) : [],
      classroomImages: [],
      personalImages: [],
      videoGallery: [],
      resultsLast4: []
    };
    
    await upsertStudentProfile(student.id, profileData);
  }
  
  return created;
}

function slugFromName(name) {
  return (name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function createStudentNoLogin({ full_name, school_id, teacher_id }) {
  const slug = slugFromName(full_name) || "student";
  const payload = {
    full_name,
    school_id,
    slug,
  };

  if (teacher_id) {
    payload.teacher_id = teacher_id;
  }

  let data;
  let error;

  ({ data, error } = await supabase
    .from("students")
    .insert(payload)
    .select("id, full_name, school_id, slug, class, section, profile_photo, created_at")
    .single());

  if (error && teacher_id) {
    const retryPayload = { full_name, school_id, slug };
    ({ data, error } = await supabase
      .from("students")
      .insert(retryPayload)
      .select("id, full_name, school_id, slug, class, section, profile_photo, created_at")
      .single());
  }

  if (error) throw error;

  return {
    ...data,
    student_url_path: `/${data?.slug || slug}`,
  };
}

export async function fetchProfilesForSchool(school_id) {
  let q = supabase
    .from("profiles")
    .select("id, full_name, role, school_id, created_at")
    .in("role", ["admin", "teacher"]);

  if (school_id) {
    q = q.eq("school_id", school_id);
  }

  const { data, error } = await q.order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchStudentBySlug(studentSlug) {
  const decoded = decodeURIComponent(studentSlug || "");
  const normalizedSlug = slugFromName(decoded);
  const normalizedName = decoded.replace(/[-_]+/g, " ").trim();
  const likeName = normalizedName.replace(/\s+/g, "%");

  const bySlug = await supabase
    .from("students")
    .select("id, full_name, school_id, slug, class, section, profile_photo, created_at")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (bySlug.error) {
    console.error('Error fetching by slug:', bySlug.error);
    return null;
  }
  if (bySlug.data) return bySlug.data;

  const { data, error } = await supabase
    .from("students")
    .select("id, full_name, school_id, slug, class, section, profile_photo, created_at")
    .ilike("full_name", likeName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching by name:', error);
    return null;
  }
  return data || null;
}

export async function fetchStudentsForSchool(school_id, teacher_id) {
  let q = supabase
    .from("students")
    .select("id, full_name, school_id, slug, class, section, profile_photo, created_at");

  if (school_id) {
    q = q.eq("school_id", school_id);
  }
  
  if (teacher_id) {
    q = q.eq("teacher_id", teacher_id);
  }

  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchStudentsForHierarchy(teacherId = null) {
  let query = supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (teacherId) {
    query = query.eq("teacher_id", teacherId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchStudentById(studentId) {
  const { data, error } = await supabase
    .from("students")
    .select("id, full_name, school_id, slug, class, section, profile_photo, created_at")
    .eq("id", studentId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchStudentProfileByStudentId(studentId) {
  const { data, error } = await supabase
    .from("student_profiles")
    .select("student_id, profile_data, updated_at")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching student profile:', error);
    return null;
  }
  return data || null;
}

export async function fetchThemes() {
  const { data, error } = await supabase
    .from("themes")
    .select("id, name, status")
    .eq("status", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchPortfolioByStudentId(studentId) {
  const { data, error } = await supabase
    .from("portfolios")
    .select("id, student_id, core_skills, academic_summary, theme_id")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function fetchAchievementsByStudentId(studentId) {
  const { data, error } = await supabase
    .from("achievements")
    .select("id, title, description, certificate_url, achievement_date")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchMediaByStudentId(studentId) {
  const { data, error } = await supabase
    .from("media")
    .select("id, type, url, category")
    .eq("student_id", studentId);
  if (error) throw error;
  return data || [];
}

async function fetchResultsByStudentId(studentId) {
  const { data, error } = await supabase
    .from("results")
    .select("id, subject, marks, grade, exam_date")
    .eq("student_id", studentId)
    .order("exam_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchTestimonialsByStudentId(studentId) {
  const { data, error } = await supabase
    .from("testimonials")
    .select("id, author_name, message, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchStudentEditorData(studentId) {
  const [student, profile, portfolio, achievements, media, results, testimonials, themes] = await Promise.all([
    fetchStudentById(studentId),
    fetchStudentProfileByStudentId(studentId),
    fetchPortfolioByStudentId(studentId),
    fetchAchievementsByStudentId(studentId),
    fetchMediaByStudentId(studentId),
    fetchResultsByStudentId(studentId),
    fetchTestimonialsByStudentId(studentId),
    fetchThemes().catch(() => []),
  ]);

  return { student, profile, portfolio, achievements, media, results, testimonials, themes };
}

function uniqueStrings(list, max) {
  const out = [];
  for (const raw of list || []) {
    const v = String(raw || "").trim();
    if (!v || out.includes(v)) continue;
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

function toLineList(value, max) {
  if (Array.isArray(value)) return uniqueStrings(value, max);
  return uniqueStrings(String(value || "").split(/\r?\n/), max);
}

function parseResultEntry(value, idx) {
  const text = String(value || "").trim();
  const percentMatch = text.match(/(\d{1,3})\s*%/);
  const yearMatch = text.match(/\b(20\d{2})\b/);
  const marks = percentMatch ? Number(percentMatch[1]) : null;
  const year = yearMatch ? `${yearMatch[1]}-01-01` : null;
  return {
    student_id: null,
    subject: `Overall ${idx + 1}`,
    marks: Number.isFinite(marks) ? marks : null,
    grade: text,
    exam_date: year,
  };
}

async function replaceRows(table, studentId, rows) {
  const del = await supabase.from(table).delete().eq("student_id", studentId);
  if (del.error) throw del.error;
  if (!rows.length) return [];
  const ins = await supabase.from(table).insert(rows);
  if (ins.error) throw ins.error;
  return rows;
}

async function replaceMedia(studentId, category, type, urls) {
  const del = await supabase
    .from("media")
    .delete()
    .eq("student_id", studentId)
    .eq("category", category)
    .eq("type", type);
  if (del.error) throw del.error;
  const rows = uniqueStrings(urls, 5).map((url) => ({ student_id: studentId, type, url, category }));
  if (!rows.length) return [];
  const ins = await supabase.from("media").insert(rows);
  if (ins.error) throw ins.error;
  return rows;
}

export async function uploadStudentFile({ bucket, studentId, file, folder = "uploads" }) {
  const ext = (file?.name?.split(".").pop() || "bin").toLowerCase();
  const name = `${folder}/${studentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const upload = await supabase.storage.from(bucket).upload(name, file, {
    upsert: false,
    cacheControl: "3600",
  });
  if (upload.error) throw upload.error;
  const publicUrl = supabase.storage.from(bucket).getPublicUrl(name).data?.publicUrl;
  return { path: name, url: publicUrl };
}

export async function saveStudentProfileStructured(studentId, rawProfile) {
  const profile = rawProfile || {};
  const fullName = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ").trim();
  const newSlug = slugFromName(fullName) || "student";
  
  if (fullName) {
    const { error } = await supabase
      .from("students")
      .update({ full_name: fullName, slug: newSlug })
      .eq("id", studentId);
    if (error) throw error;
  }
  
  const shadow = await upsertStudentProfile(studentId, rawProfile);
  return { profile: shadow, student: { slug: newSlug } };
}

export async function upsertStudentProfile(studentId, profileData) {
  const payload = {
    student_id: studentId,
    profile_data: profileData,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("student_profiles")
    .upsert(payload, { onConflict: "student_id" })
    .select("student_id, profile_data, updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPublicStudentProfileBySlug(studentSlug) {
  const student = await fetchStudentBySlug(studentSlug);
  if (!student) return null;
  const profile = await fetchStudentProfileByStudentId(student.id);
  
  if (profile?.profile_data) {
    return {
      student,
      profile_data: profile.profile_data,
      updated_at: profile.updated_at,
    };
  }
  
  const [portfolio, achievements, media, results, testimonials, themes] = await Promise.all([
    fetchPortfolioByStudentId(student.id),
    fetchAchievementsByStudentId(student.id),
    fetchMediaByStudentId(student.id),
    fetchResultsByStudentId(student.id),
    fetchTestimonialsByStudentId(student.id),
    fetchThemes().catch(() => []),
  ]);
  const themeMap = new Map(themes.map((t) => [t.id, t.name]));
  const themeName = portfolio?.theme_id ? themeMap.get(portfolio.theme_id) : null;
  const coreSkills = String(portfolio?.core_skills || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 4);
  return {
    student,
    profile_data: {
      theme: themeName || "",
      className: student.class || "",
      section: student.section || "",
      classroomImages: media.filter((m) => m.type === "image" && m.category === "classroom").map((m) => m.url),
      personalImages: media.filter((m) => m.type === "image" && m.category === "personal").map((m) => m.url),
      videoGallery: media.filter((m) => m.type === "video" && m.category === "gallery").map((m) => m.url),
      awards: achievements.filter((a) => a.description === "award").map((a) => a.title),
      certificates: achievements.filter((a) => a.description !== "award").map((a) => a.title),
      coreSkills: coreSkills,
      resultsLast4: media.filter((m) => m.type === "video" && m.category === "results").map((m) => m.url),
      testimonials: testimonials.map((t) => t.message),
      testimonial: testimonials[0]?.message || "",
    },
    updated_at: null,
  };
}
