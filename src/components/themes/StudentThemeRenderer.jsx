import { useEffect, useState } from "react";
import "./StudentThemeStyles.css";

const PORTFOLIO_NAV_ITEMS = [
  { id: "about", label: "About" },
  { id: "achievements", label: "Achievements" },
  { id: "gallery", label: "Gallery" },
  { id: "results", label: "Results" },
  { id: "testimonials", label: "Testimonials" },
  { id: "contact", label: "Contact" },
];
const NAV_SECTION_IDS = PORTFOLIO_NAV_ITEMS.map((item) => item.id);

function toList(v) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
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

function fullName(student, p) {
  const n = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ").trim();
  return n || student.full_name || "Student";
}

function parseResults(values) {
  return toList(values).slice(0, 4);
}

function parseTestimonials(profile) {
  if (Array.isArray(profile?.testimonials) && profile.testimonials.length) {
    return profile.testimonials.filter(Boolean).map((t) => String(t).trim()).filter(Boolean);
  }
  const single = String(profile?.testimonial || "").trim();
  return single ? [single] : [];
}

function heroMeta(role, p) {
  const classSection = [p.className, p.section].filter(Boolean).join(" ").trim() || "-";
  return `${role} | ${classSection} | ${p.location || "India"}`;
}

function heroTagline(role) {
  const key = String(role || "").toLowerCase();
  if (key.includes("web")) return "Designing digital experiences that feel as thoughtful as they are powerful.";
  if (key.includes("data")) return "Turning curiosity into insight, and insight into meaningful outcomes.";
  if (key.includes("sport")) return "Discipline, resilience, and performance shaped into a winning identity.";
  if (key.includes("robot")) return "Engineering ideas into impact, one precise innovation at a time.";
  return "Crafting a personal legacy where ambition, skill, and creativity move together.";
}

function toWaLink(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

function skillLevelLabel(skill) {
  const label = String(skill || "").toLowerCase();
  if (label.includes("advanced")) return "Advanced";
  if (label.includes("intermediate")) return "Intermediate";
  if (label.includes("beginner")) return "Beginner";
  return "";
}

function SkillBadge({ skill, className = "badge" }) {
  const level = skillLevelLabel(skill);
  return (
    <span className={className}>
      {skill}
      {level ? <span className="badge-level">{level}</span> : null}
    </span>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state-card" role="status" aria-live="polite">
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-copy">{description}</p>
    </div>
  );
}

function useActiveSection(sectionIds) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] || "about");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        threshold: [0.2, 0.4, 0.7],
        rootMargin: "-20% 0px -55% 0px",
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [sectionIds]);

  return activeSection;
}

function PortfolioNav({ activeSection }) {
  return (
    <nav className="portfolio-nav" aria-label="Portfolio sections">
      <div className="portfolio-nav-inner">
        {PORTFOLIO_NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`portfolio-nav-link${activeSection === item.id ? " active" : ""}`}
            aria-current={activeSection === item.id ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function HeroActions() {
  return (
    <div className="hero-actions">
      <a href="#gallery" className="hero-cta primary">View Gallery</a>
      <a href="#results" className="hero-cta">See Results</a>
      <a href="#contact" className="hero-cta">Contact</a>
    </div>
  );
}

function SectionHeading({ kicker, title, description }) {
  return (
    <div className="section-heading">
      <span className="section-kicker">{kicker}</span>
      <h2>{title}</h2>
      {description ? <p className="section-description">{description}</p> : null}
    </div>
  );
}

function AboutStorySection({ name, p, image, skills, achievementsCount }) {
  const firstName = String(name || "Student").split(" ")[0];
  const skillLine = skills?.length ? skills.join(", ") : "focused practice and curiosity";
  const city = p.location || "their city";
  const achievementTone = achievementsCount
    ? `${achievementsCount} milestone${achievementsCount > 1 ? "s" : ""}`
    : "growing milestones";

  return (
    <section className="reveal active theme-section section-about">
      <SectionHeading
        kicker="Story"
        title={`About ${firstName}`}
        description="A personal narrative of intent, growth, and future direction."
      />
      <div className="about-story-grid">
        <div className="about-story-media">
          <img src={image || "https://via.placeholder.com/900x1200"} alt={`${name} portrait`} />
        </div>
        <div className="about-story-card">
          <p>
            {firstName} is building a future around <strong>{skillLine}</strong>, with a clear focus on
            consistent progress and meaningful outcomes.
          </p>
          <p>
            From classroom effort to real portfolio execution in {city}, this journey reflects discipline,
            curiosity, and a strong intent to create impact.
          </p>
          <p>
            Every project and performance contributes to <strong>{achievementTone}</strong>, shaping an
            identity that is both creative and credible.
          </p>
        </div>
      </div>
    </section>
  );
}

function ContactSection({ p, schoolId }) {
  return (
    <section id="contact" className="reveal active theme-section section-contact">
      <SectionHeading
        kicker="Connect"
        title="Start A Conversation"
        description="For collaborations, mentorship, admissions conversations, and project opportunities."
      />
      <div className="contact-lux-wrap">
        <form className="contact-lux-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            Name
            <input type="text" placeholder="Your name" />
          </label>
          <label>
            Email
            <input type="email" placeholder="your@email.com" />
          </label>
          <label>
            Message
            <textarea rows={4} placeholder="Write your message..." />
          </label>
          <button type="submit" className="hero-cta primary">Send Message</button>
        </form>

        <div className="contact-lux-meta">
          <a className="contact-pill" href={toWaLink(p.mobile)} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="contact-pill" href={p.email ? `mailto:${p.email}` : "#"}>Email</a>
          <a className="contact-pill" href="#">Instagram</a>
          <a className="contact-pill" href="#">LinkedIn</a>
          <div className="contact-facts">
            <p>{p.email || "-"}</p>
            <p>{p.mobile || "-"}</p>
            <p>{p.location || "-"}</p>
            <p>{p.schoolName || schoolId || "-"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function buildPyramidHeights(count) {
  if (!count) return [];
  const center = (count - 1) / 2;
  const safeCenter = center || 1;
  return Array.from({ length: count }, (_, i) => {
    const d = Math.abs(i - center) / safeCenter;
    return Math.round(90 + (1 - d) * 260);
  });
}

function handleKeyboardActivate(event, onActivate) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
}

function InteractiveSurface({ className, onActivate, children, label, style }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`${className} interactive-surface`}
      onClick={onActivate}
      onKeyDown={(event) => handleKeyboardActivate(event, onActivate)}
      aria-label={label}
      style={style}
    >
      {children}
    </div>
  );
}

function Lightbox({ open, onClose, images, index, setIndex }) {
  if (!open || !images.length) return null;
  const current = images[index] || images[0];
  return (
    <div className="lightbox active" onClick={onClose}>
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close lightbox">&times;</button>
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
  const activeSection = useActiveSection(NAV_SECTION_IDS);

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
        <div id="about" className="hero reveal active portfolio-hero">
          <div className="profile-image">
            <img src={heroPhoto || personal[0]?.src || classroom[0]?.src || "https://via.placeholder.com/700"} alt={name} />
          </div>
          <div className="hero-content">
            <h1>{name}</h1>
            <p className="hero-subtitle">{heroMeta(p.theme || "Robotics", p)}</p>
            <p className="hero-tagline">{heroTagline(p.theme || "Robotics")}</p>
            <div className="badge-container">
              {skills.map((s) => <SkillBadge key={s} skill={s} />)}
            </div>
            <div className="stats">
              <div className="stat-item"><span className="stat-number">{results.length || 0}</span><div className="stat-label">Results</div></div>
              <div className="stat-item"><span className="stat-number">{achievements.length || 0}</span><div className="stat-label">Awards</div></div>
              <div className="stat-item"><span className="stat-number">{skills.length || 0}</span><div className="stat-label">Skills</div></div>
            </div>
            <HeroActions />
          </div>
        </div>

        <PortfolioNav activeSection={activeSection} />

        <AboutStorySection name={name} p={p} image={heroPhoto || personal[0]?.src || classroom[0]?.src} skills={skills} achievementsCount={achievements.length} />

        <section id="achievements" className="reveal active theme-section section-achievements">
          <SectionHeading kicker="Milestones" title="Achievements" description="Recognition that reflects consistent excellence and growth." />
          <div className="achievement-grid">
            {achievements.length ? achievements.map((a, i) => (
              <div key={`${a}-${i}`} className="achievement-card">
                <span className="achievement-index">{String(i + 1).padStart(2, "0")}</span>
                <h3>{a}</h3>
              </div>
            )) : <EmptyState title="No achievements yet" description="Add awards and certificates to highlight performance." />}
          </div>
        </section>

        <section id="gallery" className="reveal active theme-section section-gallery">
          <SectionHeading kicker="Moments" title="Classroom Moments" description="Live snapshots from practice, labs, and collaborative learning." />
          <div className="polaroid-container">
            {classroom.length ? classroom.map((img, i) => (
              <InteractiveSurface
                key={`${img.src}-${i}`}
                className="polaroid"
                onActivate={() => openGallery(classroom, i)}
                label={`Open ${img.caption}`}
              >
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </InteractiveSurface>
            )) : <EmptyState title="No classroom images" description="Upload classroom moments to build this gallery." />}
          </div>
        </section>

        <section className="reveal active theme-section section-personal">
          <SectionHeading kicker="Portfolio" title="Personal Gallery" description="Independent work, passion projects, and individual creative expression." />
          <div className="polaroid-container">
            {personal.length ? personal.map((img, i) => (
              <InteractiveSurface
                key={`${img.src}-${i}`}
                className="polaroid"
                onActivate={() => openGallery(personal, i)}
                label={`Open ${img.caption}`}
              >
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </InteractiveSurface>
            )) : <EmptyState title="No personal images" description="Add personal projects and highlights here." />}
          </div>
        </section>

        <section className="reveal active theme-section section-videos">
          <SectionHeading kicker="Showreel" title="Video Gallery" description="Demonstrations and walkthroughs that bring the portfolio to life." />
          <div className="gallery-grid">
            {videos.length ? videos.map((v, i) => {
              const embedUrl = convertToEmbedUrl(v);
              const isYouTube = embedUrl.includes('youtube.com/embed');
              return (
                <div className="gallery-tile" key={`${v}-${i}`}>
                  {isYouTube ? <iframe src={embedUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video src={v} controls />}
                </div>
              );
            }) : <EmptyState title="No videos yet" description="Attach project demos or activity videos for richer storytelling." />}
          </div>
        </section>

        <section id="results" className="reveal active theme-section section-results">
          <SectionHeading kicker="Proof" title="Academic Results" description="Verified academic outcomes and performance records." />
          <div className="gallery-grid">
            {results.length ? results.map((url, i) => (
              <InteractiveSurface
                className="gallery-tile result-viz-card"
                key={`${url}-${i}`}
                onActivate={() => window.open(url, "_blank")}
                style={{ cursor: "pointer" }}
                label={`Open result ${i + 1} in new tab`}
              >
                <span className="result-viz-label">Record {String(i + 1).padStart(2, "0")}</span>
                <div className="result-viz-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <iframe src={url} frameBorder="0" style={{width: '100%', height: '100%', pointerEvents: 'none'}} />
              </InteractiveSurface>
            )) : <EmptyState title="No academic results" description="Publish result sheets to complete the academic profile." />}
          </div>
        </section>

        <section id="testimonials" className="reveal active theme-section section-testimonials">
          <SectionHeading kicker="Credibility" title="Testimonials" description="Mentor and teacher feedback validating ability and attitude." />
          <div className="testimonials-grid">
            {testimonials.length ? testimonials.map((msg, i) => (
              <div className="testimonial-card" key={`rt-${i}`}><p>{msg}</p></div>
            )) : <EmptyState title="No testimonials yet" description="Testimonials from teachers and mentors will appear here." />}
          </div>
        </section>

        <ContactSection p={p} schoolId={student.school_id} />
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
  const activeSection = useActiveSection(NAV_SECTION_IDS);
  const classroomUsesPyramid = classroom.length >= 10;
  const personalUsesPyramid = personal.length >= 10;
  const classroomPyramidHeights = buildPyramidHeights(classroom.length);
  const personalPyramidHeights = buildPyramidHeights(personal.length);

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
        <div id="about" className="hero reveal active portfolio-hero">
          <div className="profile-image web-outline">
            <img src={heroPhoto || personal[0]?.src || classroom[0]?.src || "https://via.placeholder.com/700"} alt={name} />
          </div>
          <div className="hero-content">
            <h1>{name}</h1>
            <p className="hero-subtitle">{heroMeta(p.theme || "Web Developer", p)}</p>
            <p className="hero-tagline">{heroTagline(p.theme || "Web Developer")}</p>
            <div className="badge-container">
              {skills.map((s) => <SkillBadge key={s} skill={s} className="badge web-badge" />)}
            </div>
            <div className="stats">
              <div className="stat-item"><span className="stat-number">{results.length || 0}</span><div className="stat-label">Results</div></div>
              <div className="stat-item"><span className="stat-number">{achievements.length || 0}</span><div className="stat-label">Awards</div></div>
              <div className="stat-item"><span className="stat-number">{skills.length || 0}</span><div className="stat-label">Skills</div></div>
            </div>
            <HeroActions />
          </div>
        </div>

        <PortfolioNav activeSection={activeSection} />

        <AboutStorySection name={name} p={p} image={heroPhoto || personal[0]?.src || classroom[0]?.src} skills={skills} achievementsCount={achievements.length} />

        <section id="achievements" className="reveal active theme-section section-achievements">
          <SectionHeading kicker="Milestones" title="Achievements" description="Recognition that reflects consistent excellence and growth." />
          <div className="achievement-grid">
            {achievements.length ? achievements.map((a, i) => (
              <div key={`${a}-${i}`} className="achievement-card web-achievement">
                <span className="achievement-index">{String(i + 1).padStart(2, "0")}</span>
                <h3>{a}</h3>
              </div>
            )) : <EmptyState title="No achievements yet" description="Add awards and certificates to showcase top work." />}
          </div>
        </section>

        <section id="gallery" className="reveal active theme-section section-gallery">
          <SectionHeading kicker="Moments" title="Classroom Moments" description="Live snapshots from practice, labs, and collaborative learning." />
          {!classroom.length ? (
            <EmptyState title="No classroom images" description="Add classroom screenshots or project snapshots." />
          ) : classroomUsesPyramid ? (
            <div className="waveform-container">
              <div className="wave-grid">
                {classroom.map((item, i) => (
                  <InteractiveSurface
                    className="wave-strip"
                    style={{ height: `${classroomPyramidHeights[i]}px` }}
                    key={`cw-${i}`}
                    onActivate={() => openGallery(classroom, i)}
                    label={`Open ${item.caption}`}
                  >
                    <img src={item.src || "https://via.placeholder.com/400"} alt={item.caption || "classroom"} />
                  </InteractiveSurface>
                ))}
              </div>
            </div>
          ) : (
            <div className="compact-gallery-grid">
              {classroom.map((img, i) => (
                <InteractiveSurface
                  key={`${img.src}-${i}`}
                  className="compact-media-card"
                  onActivate={() => openGallery(classroom, i)}
                  label={`Open ${img.caption}`}
                >
                  <img src={img.src} alt={img.caption} />
                  <div className="caption">{img.caption}</div>
                </InteractiveSurface>
              ))}
            </div>
          )}
        </section>

        <section className="reveal active theme-section section-personal">
          <SectionHeading kicker="Portfolio" title="Personal Gallery" description="Independent work, passion projects, and individual creative expression." />
          {!personal.length ? (
            <EmptyState title="No personal images" description="Add hackathon, side-project, or learning moments." />
          ) : personalUsesPyramid ? (
            <div className="waveform-container">
              <div className="wave-grid">
                {personal.map((item, i) => (
                  <InteractiveSurface
                    className="wave-strip"
                    style={{ height: `${personalPyramidHeights[i]}px` }}
                    key={`pw-${i}`}
                    onActivate={() => openGallery(personal, i)}
                    label={`Open ${item.caption}`}
                  >
                    <img src={item.src || "https://via.placeholder.com/400"} alt={item.caption || "personal"} />
                  </InteractiveSurface>
                ))}
              </div>
            </div>
          ) : (
            <div className="compact-gallery-grid">
              {personal.map((img, i) => (
                <InteractiveSurface
                  key={`${img.src}-${i}`}
                  className="compact-media-card"
                  onActivate={() => openGallery(personal, i)}
                  label={`Open ${img.caption}`}
                >
                  <img src={img.src} alt={img.caption} />
                  <div className="caption">{img.caption}</div>
                </InteractiveSurface>
              ))}
            </div>
          )}
        </section>

        <section className="reveal active theme-section section-videos">
          <SectionHeading kicker="Showreel" title="Video Gallery" description="Demonstrations and walkthroughs that bring the portfolio to life." />
          <div className="gallery-grid">
            {videos.length ? videos.map((v, i) => {
              const embedUrl = convertToEmbedUrl(v);
              const isYouTube = embedUrl.includes('youtube.com/embed');
              return (
                <div className="gallery-tile" key={`${v}-${i}`}>
                  {isYouTube ? <iframe src={embedUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video src={v} controls />}
                </div>
              );
            }) : <EmptyState title="No videos yet" description="Embed walkthroughs or demo videos for better impact." />}
          </div>
        </section>

        <section id="results" className="reveal active theme-section section-results">
          <SectionHeading kicker="Proof" title="Academic Results" description="Verified academic outcomes and performance records." />
          <div className="gallery-grid">
            {results.length ? results.map((url, i) => (
              <InteractiveSurface
                className="gallery-tile result-viz-card"
                key={`${url}-${i}`}
                onActivate={() => window.open(url, "_blank")}
                style={{ cursor: "pointer" }}
                label={`Open result ${i + 1} in new tab`}
              >
                <span className="result-viz-label">Record {String(i + 1).padStart(2, "0")}</span>
                <div className="result-viz-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <iframe src={url} frameBorder="0" style={{width: '100%', height: '100%', pointerEvents: 'none'}} />
              </InteractiveSurface>
            )) : <EmptyState title="No academic results" description="Add marksheets or report cards to complete the profile." />}
          </div>
        </section>

        <section id="testimonials" className="reveal active theme-section section-testimonials">
          <SectionHeading kicker="Credibility" title="Testimonials" description="Mentor and teacher feedback validating ability and attitude." />
          <div className="testimonials-grid">
            {testimonials.length ? testimonials.map((msg, i) => (
              <div className="testimonial-card" key={`wt-${i}`}><p>{msg}</p></div>
            )) : <EmptyState title="No testimonials yet" description="Feedback and recommendations will be listed here." />}
          </div>
        </section>

        <ContactSection p={p} schoolId={student.school_id} />
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
  const activeSection = useActiveSection(NAV_SECTION_IDS);

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
        <div id="about" className="hero reveal active portfolio-hero">
          <div className="profile-image">
            <img src={heroPhoto || personal[0]?.src || classroom[0]?.src || "https://via.placeholder.com/700"} alt={name} />
          </div>
          <div className="hero-content">
            <h1>{name}</h1>
            <p className="hero-subtitle">{heroMeta("Data Scientist", p)}</p>
            <p className="hero-tagline">{heroTagline("Data Scientist")}</p>
            <div className="badge-container">
              {skills.map((s) => <SkillBadge key={s} skill={s} />)}
            </div>
            <div className="stats">
              <div className="stat-item"><span className="stat-number">{results.length || 0}</span><div className="stat-label">Results</div></div>
              <div className="stat-item"><span className="stat-number">{achievements.length || 0}</span><div className="stat-label">Projects</div></div>
              <div className="stat-item"><span className="stat-number">{skills.length || 0}</span><div className="stat-label">Skills</div></div>
            </div>
            <HeroActions />
          </div>
        </div>

        <PortfolioNav activeSection={activeSection} />

        <AboutStorySection name={name} p={p} image={heroPhoto || personal[0]?.src || classroom[0]?.src} skills={skills} achievementsCount={achievements.length} />

        <section id="achievements" className="reveal active theme-section section-achievements">
          <SectionHeading kicker="Milestones" title="Data Achievements" description="Project wins, recognitions, and certifications in data-centric work." />
          <div className="achievement-grid">
            {achievements.length ? achievements.map((a, i) => (
              <div key={`${a}-${i}`} className="achievement-card">
                <span className="achievement-index">{String(i + 1).padStart(2, "0")}</span>
                <h3>{a}</h3>
              </div>
            )) : <EmptyState title="No achievements yet" description="Publish certifications and project wins to strengthen this section." />}
          </div>
        </section>

        <section id="gallery" className="reveal active theme-section section-gallery">
          <SectionHeading kicker="Lab" title="Data Lab Sessions" description="Hands-on exploration in analytics, experimentation, and learning." />
          <div className="polaroid-container">
            {classroom.length ? classroom.map((img, i) => (
              <InteractiveSurface
                key={`${img.src}-${i}`}
                className="polaroid"
                onActivate={() => openGallery(classroom, i)}
                label={`Open ${img.caption}`}
              >
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </InteractiveSurface>
            )) : <EmptyState title="No lab images" description="Add workshop and classroom images to show your process." />}
          </div>
        </section>

        <section className="reveal active theme-section section-personal">
          <SectionHeading kicker="Insights" title="Data Visualizations" description="Visual storytelling through charts, dashboards, and patterns." />
          <div className="polaroid-container">
            {personal.length ? personal.map((img, i) => (
              <InteractiveSurface
                key={`${img.src}-${i}`}
                className="polaroid"
                onActivate={() => openGallery(personal, i)}
                label={`Open ${img.caption}`}
              >
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </InteractiveSurface>
            )) : <EmptyState title="No visualizations yet" description="Charts, dashboards, and model outputs will appear here." />}
          </div>
        </section>

        <section className="reveal active theme-section section-videos">
          <SectionHeading kicker="Showreel" title="Data Science Tutorials" description="Explainer videos and practical walkthroughs from real projects." />
          <div className="gallery-grid">
            {videos.length ? videos.map((v, i) => {
              const embedUrl = convertToEmbedUrl(v);
              const isYouTube = embedUrl.includes('youtube.com/embed');
              return (
                <div className="gallery-tile" key={`${v}-${i}`}>
                  {isYouTube ? <iframe src={embedUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video src={v} controls />}
                </div>
              );
            }) : <EmptyState title="No tutorials yet" description="Add short explainers and demo videos for data projects." />}
          </div>
        </section>

        <section id="results" className="reveal active theme-section section-results">
          <SectionHeading kicker="Proof" title="Academic Results" description="Verified academic outcomes and performance records." />
          <div className="gallery-grid">
            {results.length ? results.map((url, i) => (
              <InteractiveSurface
                className="gallery-tile result-viz-card"
                key={`${url}-${i}`}
                onActivate={() => window.open(url, "_blank")}
                style={{ cursor: "pointer" }}
                label={`Open result ${i + 1} in new tab`}
              >
                <span className="result-viz-label">Record {String(i + 1).padStart(2, "0")}</span>
                <div className="result-viz-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <iframe src={url} frameBorder="0" style={{width: '100%', height: '100%', pointerEvents: 'none'}} />
              </InteractiveSurface>
            )) : <EmptyState title="No academic results" description="Publish result PDFs to complete the academic story." />}
          </div>
        </section>

        <section id="testimonials" className="reveal active theme-section section-testimonials">
          <SectionHeading kicker="Credibility" title="Testimonials" description="Mentor and teacher feedback validating ability and attitude." />
          <div className="testimonials-grid">
            {testimonials.length ? testimonials.map((msg, i) => (
              <div className="testimonial-card" key={`dt-${i}`}><p>{msg}</p></div>
            )) : <EmptyState title="No testimonials yet" description="Mentor and teacher feedback will appear here once added." />}
          </div>
        </section>

        <ContactSection p={p} schoolId={student.school_id} />
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
  const activeSection = useActiveSection(NAV_SECTION_IDS);

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
        <div id="about" className="hero reveal active portfolio-hero">
          <div className="profile-image">
            <img src={heroPhoto || personal[0]?.src || classroom[0]?.src || "https://via.placeholder.com/700"} alt={name} />
          </div>
          <div className="hero-content">
            <h1>{name}</h1>
            <p className="hero-subtitle">{heroMeta("Athlete", p)}</p>
            <p className="hero-tagline">{heroTagline("Athlete")}</p>
            <div className="badge-container">
              {skills.map((s) => <SkillBadge key={s} skill={s} />)}
            </div>
            <div className="stats">
              <div className="stat-item"><span className="stat-number">{results.length || 0}</span><div className="stat-label">Results</div></div>
              <div className="stat-item"><span className="stat-number">{achievements.length || 0}</span><div className="stat-label">Events</div></div>
              <div className="stat-item"><span className="stat-number">{skills.length || 0}</span><div className="stat-label">Skills</div></div>
            </div>
            <HeroActions />
          </div>
        </div>

        <PortfolioNav activeSection={activeSection} />

        <AboutStorySection name={name} p={p} image={heroPhoto || personal[0]?.src || classroom[0]?.src} skills={skills} achievementsCount={achievements.length} />

        <section id="achievements" className="reveal active theme-section section-achievements">
          <SectionHeading kicker="Milestones" title="Achievements" description="Recognition that reflects consistent excellence and growth." />
          <div className="achievement-grid">
            {achievements.length ? achievements.map((a, i) => (
              <div key={`${a}-${i}`} className="achievement-card">
                <span className="achievement-index">{String(i + 1).padStart(2, "0")}</span>
                <h3>{a}</h3>
              </div>
            )) : <EmptyState title="No achievements yet" description="Add medals, recognitions, and certificates to highlight impact." />}
          </div>
        </section>

        <section id="gallery" className="reveal active theme-section section-gallery">
          <SectionHeading kicker="Training" title="Training Gallery" description="Practice intensity, drills, and preparation moments." />
          <div className="polaroid-container">
            {classroom.length ? classroom.map((img, i) => (
              <InteractiveSurface
                key={`${img.src}-${i}`}
                className="polaroid"
                onActivate={() => openGallery(classroom, i)}
                label={`Open ${img.caption}`}
              >
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </InteractiveSurface>
            )) : <EmptyState title="No training images" description="Upload practice and training photos to fill this section." />}
          </div>
        </section>

        <section className="reveal active theme-section section-personal">
          <SectionHeading kicker="Competition" title="Competition Moments" description="High-pressure events, tournaments, and standout performances." />
          <div className="polaroid-container">
            {personal.length ? personal.map((img, i) => (
              <InteractiveSurface
                key={`${img.src}-${i}`}
                className="polaroid"
                onActivate={() => openGallery(personal, i)}
                label={`Open ${img.caption}`}
              >
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </InteractiveSurface>
            )) : <EmptyState title="No competition moments yet" description="Key tournament and match moments will appear here." />}
          </div>
        </section>

        <section className="reveal active theme-section section-videos">
          <SectionHeading kicker="Showreel" title="Action Videos" description="Performance footage highlighting skill, speed, and technique." />
          <div className="gallery-grid">
            {videos.length ? videos.map((v, i) => {
              const embedUrl = convertToEmbedUrl(v);
              const isYouTube = embedUrl.includes('youtube.com/embed');
              return (
                <div className="gallery-tile" key={`${v}-${i}`}>
                  {isYouTube ? <iframe src={embedUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video src={v} controls />}
                </div>
              );
            }) : <EmptyState title="No action videos" description="Attach match or practice videos to enrich this portfolio." />}
          </div>
        </section>

        <section id="results" className="reveal active theme-section section-results">
          <SectionHeading kicker="Proof" title="Performance Results" description="Official result records and measurable outcomes." />
          <div className="gallery-grid">
            {results.length ? results.map((url, i) => (
              <InteractiveSurface
                className="gallery-tile result-viz-card"
                key={`${url}-${i}`}
                onActivate={() => window.open(url, "_blank")}
                style={{ cursor: "pointer" }}
                label={`Open result ${i + 1} in new tab`}
              >
                <span className="result-viz-label">Record {String(i + 1).padStart(2, "0")}</span>
                <div className="result-viz-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <iframe src={url} frameBorder="0" style={{width: '100%', height: '100%', pointerEvents: 'none'}} />
              </InteractiveSurface>
            )) : <EmptyState title="No performance results" description="Add official reports or score summaries for this section." />}
          </div>
        </section>

        <section id="testimonials" className="reveal active theme-section section-testimonials">
          <SectionHeading kicker="Credibility" title="Testimonials" description="Mentor and teacher feedback validating ability and attitude." />
          <div className="testimonials-grid">
            {testimonials.length ? testimonials.map((msg, i) => (
              <div className="testimonial-card" key={`st-${i}`}><p>{msg}</p></div>
            )) : <EmptyState title="No testimonials yet" description="Coach and mentor feedback will show up here once added." />}
          </div>
        </section>

        <ContactSection p={p} schoolId={student.school_id} />
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
  const activeSection = useActiveSection(NAV_SECTION_IDS);

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
        <div id="about" className="hero reveal active portfolio-hero">
          <div className="profile-image">
            <img src={heroPhoto || personal[0]?.src || classroom[0]?.src || "https://via.placeholder.com/700"} alt={name} />
          </div>
          <div className="hero-content">
            <h1>{name}</h1>
            <p className="hero-subtitle">{heroMeta(themeName, p)}</p>
            <p className="hero-tagline">{heroTagline(themeName)}</p>
            <div className="badge-container">
              {skills.map((s) => <SkillBadge key={s} skill={s} />)}
            </div>
            <div className="stats">
              <div className="stat-item"><span className="stat-number">{results.length || 0}</span><div className="stat-label">Results</div></div>
              <div className="stat-item"><span className="stat-number">{achievements.length || 0}</span><div className="stat-label">Awards</div></div>
              <div className="stat-item"><span className="stat-number">{skills.length || 0}</span><div className="stat-label">Skills</div></div>
            </div>
            <HeroActions />
          </div>
        </div>

        <PortfolioNav activeSection={activeSection} />

        <AboutStorySection name={name} p={p} image={heroPhoto || personal[0]?.src || classroom[0]?.src} skills={skills} achievementsCount={achievements.length} />

        <section id="achievements" className="reveal active theme-section section-achievements">
          <SectionHeading kicker="Milestones" title="Achievements" description="Recognition that reflects consistent excellence and growth." />
          <div className="achievement-grid">
            {achievements.length ? achievements.map((a, i) => (
              <div key={`${a}-${i}`} className="achievement-card">
                <span className="achievement-index">{String(i + 1).padStart(2, "0")}</span>
                <h3>{a}</h3>
              </div>
            )) : <EmptyState title="No achievements yet" description="Awards and highlights will be displayed in this section." />}
          </div>
        </section>

        <section id="gallery" className="reveal active theme-section section-gallery">
          <SectionHeading kicker="Moments" title="Classroom Moments" description="Live snapshots from practice, labs, and collaborative learning." />
          <div className="polaroid-container">
            {classroom.length ? classroom.map((img, i) => (
              <InteractiveSurface
                key={`${img.src}-${i}`}
                className="polaroid"
                onActivate={() => openGallery(classroom, i)}
                label={`Open ${img.caption}`}
              >
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </InteractiveSurface>
            )) : <EmptyState title="No classroom images" description="Add classroom or workshop visuals to populate this section." />}
          </div>
        </section>

        <section className="reveal active theme-section section-personal">
          <SectionHeading kicker="Portfolio" title="Personal Gallery" description="Independent work, passion projects, and individual creative expression." />
          <div className="polaroid-container">
            {personal.length ? personal.map((img, i) => (
              <InteractiveSurface
                key={`${img.src}-${i}`}
                className="polaroid"
                onActivate={() => openGallery(personal, i)}
                label={`Open ${img.caption}`}
              >
                <img src={img.src} alt={img.caption} />
                <div className="caption">{img.caption}</div>
              </InteractiveSurface>
            )) : <EmptyState title="No personal images" description="Add personal projects, events, and highlights here." />}
          </div>
        </section>

        <section className="reveal active theme-section section-videos">
          <SectionHeading kicker="Showreel" title="Video Gallery" description="Demonstrations and walkthroughs that bring the portfolio to life." />
          <div className="gallery-grid">
            {videos.length ? videos.map((v, i) => {
              const embedUrl = convertToEmbedUrl(v);
              const isYouTube = embedUrl.includes('youtube.com/embed');
              return (
                <div className="gallery-tile" key={`${v}-${i}`}>
                  {isYouTube ? <iframe src={embedUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video src={v} controls />}
                </div>
              );
            }) : <EmptyState title="No videos yet" description="Project and activity videos will show up here once uploaded." />}
          </div>
        </section>

        <section id="results" className="reveal active theme-section section-results">
          <SectionHeading kicker="Proof" title="Academic Results" description="Verified academic outcomes and performance records." />
          <div className="gallery-grid">
            {results.length ? results.map((url, i) => (
              <InteractiveSurface
                className="gallery-tile result-viz-card"
                key={`${url}-${i}`}
                onActivate={() => window.open(url, "_blank")}
                style={{ cursor: "pointer" }}
                label={`Open result ${i + 1} in new tab`}
              >
                <span className="result-viz-label">Record {String(i + 1).padStart(2, "0")}</span>
                <div className="result-viz-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <iframe src={url} frameBorder="0" style={{width: '100%', height: '100%', pointerEvents: 'none'}} />
              </InteractiveSurface>
            )) : <EmptyState title="No academic results" description="Add result documents to complete the academic overview." />}
          </div>
        </section>

        <section id="testimonials" className="reveal active theme-section section-testimonials">
          <SectionHeading kicker="Credibility" title="Testimonials" description="Mentor and teacher feedback validating ability and attitude." />
          <div className="testimonials-grid">
            {testimonials.length ? testimonials.map((msg, i) => (
              <div className="testimonial-card" key={`gt-${i}`}><p>{msg}</p></div>
            )) : <EmptyState title="No testimonials yet" description="Recommendations from mentors and peers will be listed here." />}
          </div>
        </section>

        <ContactSection p={p} schoolId={student.school_id} />
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









