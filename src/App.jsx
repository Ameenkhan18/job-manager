import { useState, useEffect } from 'react'
import './App.css'

// ── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_RESUMES = [
  { id: 1, name: 'Software Engineer Resume', link: '' },
  { id: 2, name: 'Full Stack Developer Resume', link: '' },
]

const DEFAULT_PLATFORMS = [
  { name: 'LinkedIn',   url: '' },
  { name: 'Naukri',     url: '' },
  { name: 'Indeed',     url: '' },
  { name: 'JobSearch',  url: '' },
  { name: 'Unstop',     url: '' },
  { name: 'Hirist',     url: '' },
  { name: 'Tech',       url: '' },
  { name: 'Jobsorra',   url: '' },
  { name: 'Wellfound',  url: '' },
  { name: 'Foundit',    url: '' },
]

const DEFAULT_COMPANIES = [
  { name: 'Cisco',        url: '' },
  { name: 'Wipro',        url: '' },
  { name: 'Infosys',      url: '' },
  { name: 'Cognizant',    url: '' },
  { name: 'TCS',          url: '' },
  { name: 'Accenture',    url: '' },
  { name: 'Amazon',       url: '' },
  { name: 'Google',       url: '' },
  { name: 'Microsoft',    url: '' },
  { name: 'Kyndryl',      url: '' },
  { name: 'LTIMindtree',  url: '' },
  { name: 'Deloitte',     url: '' },
  { name: 'Superside',    url: '' },
  { name: 'Ambitionbox',  url: '' },
  { name: 'Honeywell',    url: '' },
  { name: 'Birlasoft',    url: '' },
]

// ── localStorage helpers ──────────────────────────────────────────────────────

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ── ResumesSection ────────────────────────────────────────────────────────────

function ResumesSection() {
  const [resumes, setResumes] = useState(() => load('resumes', DEFAULT_RESUMES))
  const [editing, setEditing] = useState(null)
  const [draft, setDraft]     = useState('')

  useEffect(() => save('resumes', resumes), [resumes])

  function startEdit(id, field, current) {
    setEditing({ id, field })
    setDraft(current)
  }

  function commitEdit() {
    if (!editing) return
    setResumes(rs =>
      rs.map(r => r.id === editing.id ? { ...r, [editing.field]: draft } : r)
    )
    setEditing(null)
    setDraft('')
  }

  function addResume() {
    setResumes(rs => [...rs, { id: Date.now(), name: 'New Resume', link: '' }])
  }

  function removeResume(id) {
    setResumes(rs => rs.filter(r => r.id !== id))
  }

  return (
    <section id="resumes">
      <h2>My Resumes</h2>
      <p className="section-sub">Click any field to edit · Paste your Google Drive share link</p>

      <div className="resume-list">
        {resumes.map(r => (
          <div key={r.id} className="resume-card">
            {editing?.id === r.id && editing.field === 'name' ? (
              <input
                className="resume-input"
                value={draft}
                autoFocus
                onChange={e => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => e.key === 'Enter' && commitEdit()}
              />
            ) : (
              <span
                className="resume-name"
                onClick={() => startEdit(r.id, 'name', r.name)}
                title="Click to rename"
              >
                {r.name}
              </span>
            )}

            {editing?.id === r.id && editing.field === 'link' ? (
              <input
                className="resume-input link-input"
                value={draft}
                autoFocus
                placeholder="https://drive.google.com/…"
                onChange={e => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => e.key === 'Enter' && commitEdit()}
              />
            ) : (
              <span
                className="resume-link-edit"
                onClick={() => startEdit(r.id, 'link', r.link)}
                title="Click to edit link"
              >
                {r.link ? (
                  <a href={r.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                    Open Drive ↗
                  </a>
                ) : (
                  <span className="placeholder">+ Add Drive link</span>
                )}
              </span>
            )}

            <button className="remove-btn" onClick={() => removeResume(r.id)} title="Remove">✕</button>
          </div>
        ))}
      </div>

      <button className="add-resume-btn" onClick={addResume}>+ Add Resume</button>
    </section>
  )
}

// ── JobProfilesSection ────────────────────────────────────────────────────────

function ProfileRow({ item, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(item.url)

  function commit() {
    onSave(item.name, draft)
    setEditing(false)
  }

  return (
    <tr>
      <td className="profile-name">{item.name}</td>
      <td className="profile-url-cell">
        {editing ? (
          <input
            className="profile-input"
            value={draft}
            autoFocus
            placeholder="https://…"
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key === 'Enter' && commit()}
          />
        ) : item.url ? (
          <a href={item.url} target="_blank" rel="noreferrer" className="profile-link">{item.url}</a>
        ) : (
          <span className="placeholder">— not set —</span>
        )}
      </td>
      <td>
        <button className="edit-btn" onClick={() => { setDraft(item.url); setEditing(true) }}>
          {item.url ? 'Edit' : 'Add'}
        </button>
      </td>
    </tr>
  )
}

function JobProfilesSection() {
  const [platforms, setPlatforms] = useState(() => load('platforms', DEFAULT_PLATFORMS))
  const [companies, setCompanies] = useState(() => load('companies', DEFAULT_COMPANIES))

  useEffect(() => save('platforms', platforms), [platforms])
  useEffect(() => save('companies', companies), [companies])

  function saveURL(list, setList, name, url) {
    setList(list.map(i => i.name === name ? { ...i, url } : i))
  }

  return (
    <section id="job-profiles">
      <h2>Job Profiles</h2>
      <p className="section-sub">Store your profile links for every platform and company portal</p>

      <div className="profiles-grid">
        <div className="profiles-table-wrap">
          <h3>Job Boards</h3>
          <table className="profiles-table">
            <thead><tr><th>Platform</th><th>Profile URL</th><th></th></tr></thead>
            <tbody>
              {platforms.map(p => (
                <ProfileRow key={p.name} item={p} onSave={(name, url) => saveURL(platforms, setPlatforms, name, url)} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="profiles-table-wrap">
          <h3>Company Portals</h3>
          <table className="profiles-table">
            <thead><tr><th>Company</th><th>Profile / Careers URL</th><th></th></tr></thead>
            <tbody>
              {companies.map(c => (
                <ProfileRow key={c.name} item={c} onSave={(name, url) => saveURL(companies, setCompanies, name, url)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  return (
    <>
      <ResumesSection />
      <div className="ticks"></div>
      <JobProfilesSection />
      <div className="ticks"></div>
      <section id="spacer"></section>

      <style>{`
        #resumes, #job-profiles {
          max-width: 900px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }
        #resumes h2, #job-profiles h2 {
          font-size: 1.6rem;
          margin-bottom: 0.25rem;
        }
        .section-sub {
          font-size: 0.85rem;
          opacity: 0.6;
          margin-bottom: 1.5rem;
        }
        .resume-list {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          margin-bottom: 1.2rem;
        }
        .resume-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 0.65rem 1rem;
          flex-wrap: wrap;
        }
        .resume-name {
          flex: 1;
          font-weight: 600;
          cursor: pointer;
          min-width: 120px;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .resume-name:hover { background: rgba(255,255,255,0.08); }
        .resume-link-edit {
          flex: 2;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 2px 4px;
          border-radius: 4px;
          min-width: 140px;
        }
        .resume-link-edit:hover { background: rgba(255,255,255,0.08); }
        .resume-input, .link-input {
          flex: 1;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 6px;
          padding: 0.3rem 0.6rem;
          color: inherit;
          font-size: 0.9rem;
          min-width: 160px;
        }
        .link-input { flex: 2; }
        .placeholder { opacity: 0.4; font-style: italic; }
        .remove-btn {
          background: none;
          border: none;
          color: #ff6b6b;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 0 4px;
          opacity: 0.6;
        }
        .remove-btn:hover { opacity: 1; }
        .add-resume-btn {
          background: rgba(255,255,255,0.07);
          border: 1px dashed rgba(255,255,255,0.25);
          border-radius: 8px;
          color: inherit;
          cursor: pointer;
          padding: 0.5rem 1.2rem;
          font-size: 0.9rem;
          transition: background 0.2s;
        }
        .add-resume-btn:hover { background: rgba(255,255,255,0.12); }
        .profiles-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 680px) {
          .profiles-grid { grid-template-columns: 1fr; }
        }
        .profiles-table-wrap h3 {
          font-size: 1rem;
          margin-bottom: 0.6rem;
          opacity: 0.8;
        }
        .profiles-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .profiles-table th {
          text-align: left;
          padding: 0.4rem 0.6rem;
          border-bottom: 1px solid rgba(255,255,255,0.15);
          opacity: 0.5;
          font-weight: 500;
        }
        .profiles-table td {
          padding: 0.45rem 0.6rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          vertical-align: middle;
        }
        .profile-name { font-weight: 500; white-space: nowrap; }
        .profile-url-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .profile-link { color: #61dafb; text-decoration: none; font-size: 0.8rem; }
        .profile-link:hover { text-decoration: underline; }
        .profile-input {
          width: 100%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 6px;
          padding: 0.25rem 0.5rem;
          color: inherit;
          font-size: 0.82rem;
        }
        .edit-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          color: inherit;
          cursor: pointer;
          font-size: 0.75rem;
          padding: 0.15rem 0.5rem;
          opacity: 0.65;
          white-space: nowrap;
        }
        .edit-btn:hover { opacity: 1; background: rgba(255,255,255,0.08); }
      `}</style>
    </>
  )
}

export default App
