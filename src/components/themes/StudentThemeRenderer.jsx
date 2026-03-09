import { useMemo, useState } from "react";
import "./StudentThemeStyles.css";

function toList(v) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
}

function fullName(student, p) {
  const n = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ").trim();
  return n || student.full_name || "Student";
}

function parseResults(values) {
  return toList(values).slice(0, 4).map((item, i) => {
    const raw = String(item);
    const yearMatch = raw.match(/\b(20\d{2})\b/);
    const percentMatch = raw.match(/(\d{1,3})\s*%/);
    return {
      year: yearMatch ? yearMatch[1] : `Year ${i + 1}`,
      percentage: percentMatch ? `${percentMatch[1]}%` : raw,
    };
  });
}

function parseTestimonials(profile) {
  if (Array.isArray(profile?.testimonials) && profile.testimonials.length) {
    return profile.testimonials.filter(Boolean).map((t) => String(t).trim()).filter(Boolean);
  }
  const single = String(profile?.testimonial || "").trim();
  return single ? [single] : [];
}

function Lightbox({ open, onClose, images, index, setIndex }) {
  if (!open || !images.length) return null;
  const current = images[index] || images[0];
  return (
    <div className="lightbox active" onClick={onClose}>
      <span className="lightbox-close" onClick={onClose}>&times;</span>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="nav-btn" onClick={() => setIndex((index - 1 + images.length) % images.length)}>{"<"}</button>
        <img src={current.src} alt={current.caption || "image"} />
        <button className="nav-btn" onClick={() => setIndex((index + 1) % images.length)}>{">"}</button>
      </div>
      <div className="lightbox-caption">{current.caption || ""}</div>
    </div>
  );
}

function RoboticsTheme({ student, profile }) {
  const p = profile || {};
  const name = fullName(student, p);
  const heroPhoto = p.profilePhoto || student.profile_photo;
  const skills = toList(p.coreSkills).slice(0, 4);
  const classroom = toList(p.classroomImages).map((src, i) => ({ src, caption: `Classroom ${i + 1}` }));
  const personal = toList(p.personalImages).map((src, i) => ({ src, caption: `Personal ${i + 1}` }));
  const videos = toList(p.videoGallery).slice(0, 10);
  const results = parseResults(p.resultsLast4);
  const achievements = [...toList(p.awards), ...toList(p.certificates)].slice(0, 8);
  const testimonials = parseTestimonials(p);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState([]);
  const [lbIndex, setLbIndex] = useState(0);

  function openGallery(images, idx) {
    setLbImages(images);
    setLbIndex(idx);
    setLbOpen(true);
  }

  return (
    <div className="theme-root robotics-theme">
      <div className="bg-lines" />
      <div className="profile-banner robotics-banner" />
      <div className="container">
        <div className="hero reveal active">
          <div className="profile-image">
            <img src={heroPhoto || personal[0]?.src || classroom[0]?.src || "https://via.placeholder.com/700"} alt={name} />
          </div>
          <div className="hero-content">
            <h1>{name}</h1>
            <p>{p.theme || "Robotics"} · {p.className || "-"} {p.section || ""} · {p.location || "India"}</p>
            <div className="badge-container">
              {skills.map((s) => <span key={s} className="badge">{s}</span>)}
            </div>
            <div className="stats">
              <div className="stat-item"><span className="stat-number">{results.length || 0}</span><div className="stat-label">Results</div></div>
              <div className="stat-item"><span className="stat-number">{achievements.length || 0}</span><div className="stat-label">Awards</div></div>
              <div className="stat-item"><span className="stat-number">{skills.length || 0}</span><div className="stat-label">Skills</div></div>
            </div>
          </div>
        </div>

        <div className="card reveal active contact-card">
          <div>{p.email || "-"}</div>
          <div>{p.mobile || "-"}</div>
          <div>{p.location || "-"}</div>
          <div>{p.schoolName || student.school_id || "-"}</div>
        </div>

        <section className="reveal active">
          <h2>Achievements</h2>
          <div className="achievement-grid">
            {achievements.map((a, i) => (
              <div key={`${a}-${i}`} className="achievement-card"><h3>{a}</h3></div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Classroom moments</h2>
          <div className="polaroid-container">
            {classroom.map((img, i) => (
              <div key={`${img.src}-${i}`} className="polaroid" onClick={() => openGallery(classroom, i)}>
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Personal gallery</h2>
          <div className="polaroid-container">
            {personal.map((img, i) => (
              <div key={`${img.src}-${i}`} className="polaroid" onClick={() => openGallery(personal, i)}>
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Video gallery</h2>
          <div className="gallery-grid">
            {videos.map((v, i) => (
              <div className="gallery-tile" key={`${v}-${i}`}>
                <video src={v} controls />
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Academic Results</h2>
          <div className="results-grid">
            {results.map((r) => (
              <div className="result-card" key={`${r.year}-${r.percentage}`}>
                <div className="result-year">{r.year}</div>
                <div className="result-percentage">{r.percentage}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Testimonials</h2>
          <div className="testimonials-grid">
            {(testimonials.length ? testimonials : ["No testimonial added yet."]).map((msg, i) => (
              <div className="testimonial-card" key={`rt-${i}`}><p>{msg}</p></div>
            ))}
          </div>
        </section>
      </div>
      <Lightbox open={lbOpen} onClose={() => setLbOpen(false)} images={lbImages} index={lbIndex} setIndex={setLbIndex} />
    </div>
  );
}

function WebTheme({ student, profile }) {
  const p = profile || {};
  const name = fullName(student, p);
  const heroPhoto = p.profilePhoto || student.profile_photo;
  const skills = toList(p.coreSkills).slice(0, 4);
  const classroom = toList(p.classroomImages).map((src, i) => ({ src, caption: `Classroom ${i + 1}` }));
  const personal = toList(p.personalImages).map((src, i) => ({ src, caption: `Personal ${i + 1}` }));
  const videos = toList(p.videoGallery).slice(0, 10);
  const results = parseResults(p.resultsLast4);
  const achievements = [...toList(p.awards), ...toList(p.certificates)].slice(0, 8);
  const testimonials = parseTestimonials(p);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState([]);
  const [lbIndex, setLbIndex] = useState(0);

  const waveHeights = useMemo(() => {
    const count = Math.max(20, classroom.length || 20);
    const center = (count - 1) / 2;
    const out = [];
    for (let i = 0; i < count; i += 1) {
      const d = Math.abs(i - center) / center;
      out.push(Math.round(90 + (1 - d) * 260));
    }
    return out;
  }, [classroom.length]);

  function openGallery(images, idx) {
    setLbImages(images);
    setLbIndex(idx);
    setLbOpen(true);
  }

  return (
    <div className="theme-root web-theme">
      <div className="bg-lines" />
      <div className="profile-banner web-banner" />
      <div className="container">
        <div className="hero reveal active">
          <div className="profile-image web-outline">
            <img src={heroPhoto || personal[0]?.src || classroom[0]?.src || "https://via.placeholder.com/700"} alt={name} />
          </div>
          <div className="hero-content">
            <h1>{name}</h1>
            <p>{p.theme || "Web Developer"} · {p.className || "-"} {p.section || ""} · {p.location || "India"}</p>
            <div className="badge-container">
              {skills.map((s) => <span key={s} className="badge web-badge">{s}</span>)}
            </div>
          </div>
        </div>

        <section className="reveal active">
          <h2>Achievements</h2>
          <div className="achievement-grid">
            {achievements.map((a, i) => (
              <div key={`${a}-${i}`} className="achievement-card web-achievement"><h3>{a}</h3></div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Classroom moments</h2>
          <div className="waveform-container">
            <div className="wave-grid">
              {waveHeights.map((h, i) => {
                const item = classroom[i % Math.max(classroom.length, 1)] || {};
                return (
                  <div className="wave-strip" style={{ height: `${h}px` }} key={`cw-${i}`} onClick={() => openGallery(classroom, i % Math.max(classroom.length, 1))}>
                    <img src={item.src || "https://via.placeholder.com/400"} alt={item.caption || "classroom"} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="reveal active">
          <h2>Personal gallery</h2>
          <div className="waveform-container">
            <div className="wave-grid">
              {waveHeights.map((h, i) => {
                const item = personal[i % Math.max(personal.length, 1)] || {};
                return (
                  <div className="wave-strip" style={{ height: `${h}px` }} key={`pw-${i}`} onClick={() => openGallery(personal, i % Math.max(personal.length, 1))}>
                    <img src={item.src || "https://via.placeholder.com/400"} alt={item.caption || "personal"} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="reveal active">
          <h2>Video gallery</h2>
          <div className="gallery-grid">
            {videos.map((v, i) => (
              <div className="gallery-tile" key={`${v}-${i}`}>
                <video src={v} controls />
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Academic Results</h2>
          <div className="results-grid">
            {results.map((r) => (
              <div className="result-card" key={`${r.year}-${r.percentage}`}>
                <div className="result-year">{r.year}</div>
                <div className="result-percentage">{r.percentage}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Testimonials</h2>
          <div className="testimonials-grid">
            {(testimonials.length ? testimonials : ["No testimonial added yet."]).map((msg, i) => (
              <div className="testimonial-card" key={`wt-${i}`}><p>{msg}</p></div>
            ))}
          </div>
        </section>
      </div>
      <Lightbox open={lbOpen} onClose={() => setLbOpen(false)} images={lbImages} index={lbIndex} setIndex={setLbIndex} />
    </div>
  );
}

function DataScienceTheme({ student, profile }) {
  const p = profile || {};
  const name = fullName(student, p);
  const heroPhoto = p.profilePhoto || student.profile_photo;
  const skills = toList(p.coreSkills).slice(0, 4);
  const classroom = toList(p.classroomImages).map((src, i) => ({ src, caption: `Lab ${i + 1}` }));
  const personal = toList(p.personalImages).map((src, i) => ({ src, caption: `Chart ${i + 1}` }));
  const videos = toList(p.videoGallery).slice(0, 10);
  const results = parseResults(p.resultsLast4);
  const achievements = [...toList(p.awards), ...toList(p.certificates)].slice(0, 5);
  const testimonials = parseTestimonials(p);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState([]);
  const [lbIndex, setLbIndex] = useState(0);

  function openGallery(images, idx) {
    setLbImages(images);
    setLbIndex(idx);
    setLbOpen(true);
  }

  return (
    <div className="theme-root datascience-theme">
      <div className="bg-lines" />
      <div className="profile-banner datascience-banner" />
      <div className="container">
        <div className="hero reveal active">
          <div className="profile-image">
            <img src={heroPhoto || personal[0]?.src || classroom[0]?.src || "https://via.placeholder.com/700"} alt={name} />
          </div>
          <div className="hero-content">
            <h1>{name}</h1>
            <p>Data Scientist · {p.className || "-"} {p.section || ""} · {p.location || "India"}</p>
            <div className="badge-container">
              {skills.map((s) => <span key={s} className="badge">{s}</span>)}
            </div>
            <div className="stats">
              <div className="stat-item"><span className="stat-number">{p.age || 15}</span><div className="stat-label">Age</div></div>
              <div className="stat-item"><span className="stat-number">{p.className || "10th"}</span><div className="stat-label">Grade</div></div>
              <div className="stat-item"><span className="stat-number">{achievements.length || 12}</span><div className="stat-label">Projects</div></div>
            </div>
          </div>
        </div>

        <div className="card reveal active contact-card">
          <div>{p.email || "-"}</div>
          <div>{p.mobile || "-"}</div>
          <div>{p.location || "-"}</div>
          <div>{p.schoolName || student.school_id || "-"}</div>
        </div>

        <section className="reveal active">
          <h2>Data Achievements</h2>
          <div className="achievement-grid">
            {achievements.map((a, i) => (
              <div key={`${a}-${i}`} className="achievement-card"><h3>{a}</h3></div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Data Lab Sessions</h2>
          <div className="polaroid-container">
            {classroom.map((img, i) => (
              <div key={`${img.src}-${i}`} className="polaroid" onClick={() => openGallery(classroom, i)}>
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Data Visualizations</h2>
          <div className="polaroid-container">
            {personal.map((img, i) => (
              <div key={`${img.src}-${i}`} className="polaroid" onClick={() => openGallery(personal, i)}>
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Data Science Tutorials</h2>
          <div className="gallery-grid">
            {videos.map((v, i) => (
              <div className="gallery-tile" key={`${v}-${i}`}>
                <video src={v} controls />
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Academic Results</h2>
          <div className="results-grid">
            {results.map((r) => (
              <div className="result-card" key={`${r.year}-${r.percentage}`}>
                <div className="result-year">{r.year}</div>
                <div className="result-percentage">{r.percentage}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Testimonials</h2>
          <div className="testimonials-grid">
            {(testimonials.length ? testimonials : ["No testimonial added yet."]).map((msg, i) => (
              <div className="testimonial-card" key={`dt-${i}`}><p>{msg}</p></div>
            ))}
          </div>
        </section>
      </div>
      <Lightbox open={lbOpen} onClose={() => setLbOpen(false)} images={lbImages} index={lbIndex} setIndex={setLbIndex} />
    </div>
  );
}

function SportsTheme({ student, profile }) {
  const p = profile || {};
  const name = fullName(student, p);
  const heroPhoto = p.profilePhoto || student.profile_photo;
  const skills = toList(p.coreSkills).slice(0, 4);
  const classroom = toList(p.classroomImages).map((src, i) => ({ src, caption: `Training ${i + 1}` }));
  const personal = toList(p.personalImages).map((src, i) => ({ src, caption: `Event ${i + 1}` }));
  const videos = toList(p.videoGallery).slice(0, 10);
  const results = parseResults(p.resultsLast4);
  const achievements = [...toList(p.awards), ...toList(p.certificates)].slice(0, 5);
  const testimonials = parseTestimonials(p);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState([]);
  const [lbIndex, setLbIndex] = useState(0);

  function openGallery(images, idx) {
    setLbImages(images);
    setLbIndex(idx);
    setLbOpen(true);
  }

  return (
    <div className="theme-root sports-theme">
      <div className="bg-lines" />
      <div className="profile-banner sports-banner" />
      <div className="container">
        <div className="hero reveal active">
          <div className="profile-image">
            <img src={heroPhoto || personal[0]?.src || classroom[0]?.src || "https://via.placeholder.com/700"} alt={name} />
          </div>
          <div className="hero-content">
            <h1>{name}</h1>
            <p>Athlete · {p.className || "-"} {p.section || ""} · {p.location || "India"}</p>
            <div className="badge-container">
              {skills.map((s) => <span key={s} className="badge">{s}</span>)}
            </div>
            <div className="stats">
              <div className="stat-item"><span className="stat-number">{p.age || 18}</span><div className="stat-label">Age</div></div>
              <div className="stat-item"><span className="stat-number">{achievements.length || 12}</span><div className="stat-label">Events</div></div>
              <div className="stat-item"><span className="stat-number">{results.length || 4}</span><div className="stat-label">Podiums</div></div>
            </div>
          </div>
        </div>

        <div className="card reveal active contact-card">
          <div>{p.email || "-"}</div>
          <div>{p.mobile || "-"}</div>
          <div>{p.location || "-"}</div>
          <div>{p.schoolName || student.school_id || "-"}</div>
        </div>

        <section className="reveal active">
          <h2>Achievements</h2>
          <div className="achievement-grid">
            {achievements.map((a, i) => (
              <div key={`${a}-${i}`} className="achievement-card"><h3>{a}</h3></div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Training Gallery</h2>
          <div className="polaroid-container">
            {classroom.map((img, i) => (
              <div key={`${img.src}-${i}`} className="polaroid" onClick={() => openGallery(classroom, i)}>
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Competition Moments</h2>
          <div className="polaroid-container">
            {personal.map((img, i) => (
              <div key={`${img.src}-${i}`} className="polaroid" onClick={() => openGallery(personal, i)}>
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Action Videos</h2>
          <div className="gallery-grid">
            {videos.map((v, i) => (
              <div className="gallery-tile" key={`${v}-${i}`}>
                <video src={v} controls />
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Performance Results</h2>
          <div className="results-grid">
            {results.map((r) => (
              <div className="result-card" key={`${r.year}-${r.percentage}`}>
                <div className="result-year">{r.year}</div>
                <div className="result-percentage">{r.percentage}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Testimonials</h2>
          <div className="testimonials-grid">
            {(testimonials.length ? testimonials : ["No testimonial added yet."]).map((msg, i) => (
              <div className="testimonial-card" key={`st-${i}`}><p>{msg}</p></div>
            ))}
          </div>
        </section>
      </div>
      <Lightbox open={lbOpen} onClose={() => setLbOpen(false)} images={lbImages} index={lbIndex} setIndex={setLbIndex} />
    </div>
  );
}

function GenericTheme({ student, profile, themeClass, themeName }) {
  const p = profile || {};
  const name = fullName(student, p);
  const heroPhoto = p.profilePhoto || student.profile_photo;
  const skills = toList(p.coreSkills).slice(0, 4);
  const classroom = toList(p.classroomImages).map((src, i) => ({ src, caption: `Classroom ${i + 1}` }));
  const personal = toList(p.personalImages).map((src, i) => ({ src, caption: `Personal ${i + 1}` }));
  const videos = toList(p.videoGallery).slice(0, 10);
  const results = parseResults(p.resultsLast4);
  const achievements = [...toList(p.awards), ...toList(p.certificates)].slice(0, 8);
  const testimonials = parseTestimonials(p);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState([]);
  const [lbIndex, setLbIndex] = useState(0);

  function openGallery(images, idx) {
    setLbImages(images);
    setLbIndex(idx);
    setLbOpen(true);
  }

  return (
    <div className={`theme-root ${themeClass}`}>
      <div className="bg-lines" />
      <div className={`profile-banner ${themeClass}-banner`} />
      <div className="container">
        <div className="hero reveal active">
          <div className="profile-image">
            <img src={heroPhoto || personal[0]?.src || classroom[0]?.src || "https://via.placeholder.com/700"} alt={name} />
          </div>
          <div className="hero-content">
            <h1>{name}</h1>
            <p>{themeName} · {p.className || "-"} {p.section || ""} · {p.location || "India"}</p>
            <div className="badge-container">
              {skills.map((s) => <span key={s} className="badge">{s}</span>)}
            </div>
            <div className="stats">
              <div className="stat-item"><span className="stat-number">{results.length || 0}</span><div className="stat-label">Results</div></div>
              <div className="stat-item"><span className="stat-number">{achievements.length || 0}</span><div className="stat-label">Awards</div></div>
              <div className="stat-item"><span className="stat-number">{skills.length || 0}</span><div className="stat-label">Skills</div></div>
            </div>
          </div>
        </div>

        <div className="card reveal active contact-card">
          <div>{p.email || "-"}</div>
          <div>{p.mobile || "-"}</div>
          <div>{p.location || "-"}</div>
          <div>{p.schoolName || student.school_id || "-"}</div>
        </div>

        <section className="reveal active">
          <h2>Achievements</h2>
          <div className="achievement-grid">
            {achievements.map((a, i) => (
              <div key={`${a}-${i}`} className="achievement-card"><h3>{a}</h3></div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Classroom moments</h2>
          <div className="polaroid-container">
            {classroom.map((img, i) => (
              <div key={`${img.src}-${i}`} className="polaroid" onClick={() => openGallery(classroom, i)}>
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Personal gallery</h2>
          <div className="polaroid-container">
            {personal.map((img, i) => (
              <div key={`${img.src}-${i}`} className="polaroid" onClick={() => openGallery(personal, i)}>
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Video gallery</h2>
          <div className="gallery-grid">
            {videos.map((v, i) => (
              <div className="gallery-tile" key={`${v}-${i}`}>
                <video src={v} controls />
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Academic Results</h2>
          <div className="results-grid">
            {results.map((r) => (
              <div className="result-card" key={`${r.year}-${r.percentage}`}>
                <div className="result-year">{r.year}</div>
                <div className="result-percentage">{r.percentage}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal active">
          <h2>Testimonials</h2>
          <div className="testimonials-grid">
            {(testimonials.length ? testimonials : ["No testimonial added yet."]).map((msg, i) => (
              <div className="testimonial-card" key={`gt-${i}`}><p>{msg}</p></div>
            ))}
          </div>
        </section>
      </div>
      <Lightbox open={lbOpen} onClose={() => setLbOpen(false)} images={lbImages} index={lbIndex} setIndex={setLbIndex} />
    </div>
  );
}

export default function StudentThemeRenderer({ student, profile }) {
  const theme = String(profile?.theme || "").toLowerCase();
  if (theme.includes("sport")) return <SportsTheme student={student} profile={profile} />;
  if (theme.includes("data")) return <DataScienceTheme student={student} profile={profile} />;
  if (theme.includes("web")) return <WebTheme student={student} profile={profile} />;
  if (theme.includes("music")) return <GenericTheme student={student} profile={profile} themeClass="music-theme" themeName="Music" />;
  if (theme.includes("art")) return <GenericTheme student={student} profile={profile} themeClass="art-theme" themeName="Art & Design" />;
  if (theme.includes("photo")) return <GenericTheme student={student} profile={profile} themeClass="photography-theme" themeName="Photography" />;
  if (theme.includes("gam")) return <GenericTheme student={student} profile={profile} themeClass="gaming-theme" themeName="Gaming" />;
  if (theme.includes("dance")) return <GenericTheme student={student} profile={profile} themeClass="dance-theme" themeName="Dance" />;
  if (theme.includes("cook") || theme.includes("culinary")) return <GenericTheme student={student} profile={profile} themeClass="culinary-theme" themeName="Culinary Arts" />;
  if (theme.includes("fashion")) return <GenericTheme student={student} profile={profile} themeClass="fashion-theme" themeName="Fashion" />;
  if (theme.includes("film") || theme.includes("cinema")) return <GenericTheme student={student} profile={profile} themeClass="film-theme" themeName="Film & Cinema" />;
  if (theme.includes("environment") || theme.includes("eco")) return <GenericTheme student={student} profile={profile} themeClass="environment-theme" themeName="Environment" />;
  if (theme.includes("space") || theme.includes("astro")) return <GenericTheme student={student} profile={profile} themeClass="space-theme" themeName="Space & Astronomy" />;
  if (theme.includes("literature") || theme.includes("writing")) return <GenericTheme student={student} profile={profile} themeClass="literature-theme" themeName="Literature" />;
  if (theme.includes("business") || theme.includes("entrepreneur")) return <GenericTheme student={student} profile={profile} themeClass="business-theme" themeName="Business" />;
  return <RoboticsTheme student={student} profile={profile} />;
}
