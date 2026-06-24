import { useState, useEffect, Fragment } from "react";
import './App.css'

const STATUS_CONFIG = {
  Applied:   { color: "#22D3EE", glow: "rgba(34,211,238,0.15)",   bg: "rgba(34,211,238,0.08)",   border: "rgba(34,211,238,0.3)" },
  Pending:   { color: "#F97316", glow: "rgba(249,115,22,0.15)",   bg: "rgba(249,115,22,0.08)",   border: "rgba(249,115,22,0.3)" },
  Interview: { color: "#A78BFA", glow: "rgba(167,139,250,0.15)",  bg: "rgba(167,139,250,0.08)",  border: "rgba(167,139,250,0.3)" },
  Rejected:  { color: "#F87171", glow: "rgba(248,113,113,0.15)",  bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.3)" },
  Offered:   { color: "#4ADE80", glow: "rgba(74,222,128,0.15)",   bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.3)" },
  Saved:     { color: "#FBBF24", glow: "rgba(251,191,36,0.15)",   bg: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.3)" },
};

const ROLES = [
  "Software Engineer","Frontend Engineer","Backend Engineer","Full Stack",
  "Data Scientist","ML Engineer","Product Manager","Designer","DevOps",
  "QA Engineer","Other",
];

const EMPTY_FORM = {
  company: "", role: "", jobLink: "", resumeLink: "", status: "Pending",
  dateApplied: new Date().toISOString().slice(0, 10), notes: "",
};

const STORAGE_KEY = "job_tracker_applications";

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600,
      letterSpacing: 0.5, whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace",
    }}>{status}</span>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#0d0d1a", borderRadius: 14, border: "1px solid #1a1a2e",
        padding: "1.5rem", width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto",
      }}>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 10, color: "#555", marginBottom: 5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>{label}</label>
      {children}
    </div>
  );
}

function JobTracker() {
  const [apps, setApps] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRole, setFilterRole] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("dateApplied");
  const [sortDir, setSortDir] = useState("desc");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notesModal, setNotesModal] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setApps(JSON.parse(saved));
    } catch {}
  }, []);

  const save = (data) => {
    setApps(data);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  };

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setModalOpen(true); };
  const openEdit = (app) => { setForm({ ...app }); setEditId(app.id); setModalOpen(true); };

  const handleSubmit = () => {
    if (!form.company.trim() || !form.role.trim()) return;
    if (editId) {
      save(apps.map(a => a.id === editId ? { ...form, id: editId } : a));
    } else {
      save([...apps, { ...form, id: Date.now() }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => { save(apps.filter(a => a.id !== id)); setDeleteConfirm(null); };
  const handleStatusChange = (id, status) => save(apps.map(a => a.id === id ? { ...a, status } : a));
  const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = apps
    .filter(a => filterStatus === "All" || a.status === filterStatus)
    .filter(a => filterRole === "All" || a.role === filterRole)
    .filter(a => !search || a.company.toLowerCase().includes(search.toLowerCase()) || a.role.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let va = a[sortKey] || "", vb = b[sortKey] || "";
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  // Group rows by date so each day gets its own header in the table.
  // Rows with no date are bucketed under "No date".
  const groupedByDate = (() => {
    const map = new Map();
    filtered.forEach(app => {
      const key = app.dateApplied || "No date";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(app);
    });
    const keys = [...map.keys()];
    keys.sort((a, b) => {
      if (a === "No date") return 1;
      if (b === "No date") return -1;
      return sortDir === "asc" ? a.localeCompare(b) : b.localeCompare(a);
    });
    return keys.map(key => ({ date: key, rows: map.get(key) }));
  })();

  const formatDateHeader = (dateStr) => {
    if (dateStr === "No date") return "NO DATE";
    try {
      const d = new Date(dateStr + "T00:00:00");
      const weekday = d.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
      return `${dateStr} · ${weekday}`;
    } catch {
      return dateStr;
    }
  };

  const stats = Object.keys(STATUS_CONFIG).map(s => ({ label: s, count: apps.filter(a => a.status === s).length }));
  const allRoles = [...new Set(apps.map(a => a.role).filter(Boolean))];
  const activeCount = apps.filter(a => a.status === "Applied" || a.status === "Interview").length;

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }) => (
    <span style={{ fontSize: 9, marginLeft: 4, opacity: sortKey === col ? 1 : 0.25 }}>
      {sortKey === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13,
    border: "1px solid #1a1a2e", background: "#111122",
    color: "#E2E8F0", boxSizing: "border-box",
    fontFamily: "'JetBrains Mono', monospace",
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#E2E8F0", fontFamily: "'JetBrains Mono', monospace", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; }
        html, body, #root { background: #080810 !important; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .stat-card { transition: all 0.15s; cursor: pointer; }
        .stat-card:hover { transform: translateY(-1px); }
        .row-hover:hover { background: #0d0d1a !important; }
        .action-btn { transition: all 0.15s; }
        .action-btn:hover { filter: brightness(1.2); }
        input:focus, select:focus, textarea:focus { border-color: #333 !important; box-shadow: 0 0 0 2px rgba(167,139,250,0.15); }
      `}</style>

      <div style={{ padding: "20px 16px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ background: "#0d0d1a", borderBottom: "1px solid #1a1a2e", padding: "20px 0 16px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: 4, color: "#fff", lineHeight: 1 }}>
                JOB TRACKER
              </div>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginTop: 4 }}>
                {apps.length} TOTAL · {activeCount} ACTIVE
              </div>
            </div>
            <button onClick={openAdd} className="action-btn" style={{
              background: "#A78BFA", color: "#000", border: "none", borderRadius: 8,
              padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, fontSize: 15,
            }}>+ ADD APPLICATION</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8, marginBottom: 20 }}>
          {stats.map(s => {
            const cfg = STATUS_CONFIG[s.label];
            const active = filterStatus === s.label;
            return (
              <div key={s.label} className="stat-card" onClick={() => setFilterStatus(active ? "All" : s.label)} style={{
                background: active ? cfg.bg : "#0d0d1a",
                border: `1px solid ${active ? cfg.border : "#1a1a2e"}`,
                borderRadius: 10, padding: "12px 14px",
                boxShadow: active ? `0 0 12px ${cfg.glow}` : "none",
              }}>
                <p style={{ margin: 0, fontSize: 9, color: active ? cfg.color : "#444", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>{s.label}</p>
                <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 700, color: active ? cfg.color : "#ccc", fontFamily: "'Bebas Neue', sans-serif", lineHeight: 1 }}>{s.count}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input placeholder="Search company or role…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 220, flex: "1 1 160px" }} />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            style={{ ...inputStyle, width: "auto", flex: "0 0 auto" }}>
            <option value="All">All roles</option>
            {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {(filterStatus !== "All" || filterRole !== "All" || search) && (
            <button onClick={() => { setFilterStatus("All"); setFilterRole("All"); setSearch(""); }} className="action-btn"
              style={{ fontSize: 11, color: "#555", background: "none", border: "1px solid #1a1a2e", borderRadius: 8, padding: "6px 14px", cursor: "pointer", letterSpacing: 1 }}>
              CLEAR FILTERS
            </button>
          )}
        </div>

        {/* Table */}
        {apps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#333" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 3, marginBottom: 8 }}>NO APPLICATIONS YET</div>
            <div style={{ fontSize: 12, color: "#444" }}>Click "Add application" to get started</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#444", fontSize: 13 }}>
            No applications match your filters
          </div>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #1a1a2e" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "16%" }} /><col style={{ width: "14%" }} /><col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} /><col style={{ width: "10%" }} /><col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} /><col style={{ width: "10%" }} /><col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#0d0d1a", borderBottom: "1px solid #1a1a2e" }}>
                  {[["company","COMPANY"],["role","ROLE"],["status","STATUS"],["dateApplied","DATE"]].map(([k, l]) => (
                    <th key={k} onClick={() => toggleSort(k)} style={{
                      padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#444",
                      cursor: "pointer", userSelect: "none", fontSize: 9, letterSpacing: 2,
                    }}>
                      {l}<SortIcon col={k} />
                    </th>
                  ))}
                  {["JOB LINK","RESUME","NOTES","STATUS","ACTIONS"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#444", fontSize: 9, letterSpacing: 2 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedByDate.map(group => (
                  <Fragment key={group.date}>
                    <tr key={`hdr-${group.date}`}>
                      <td colSpan={9} style={{
                        padding: "8px 12px", background: "#0d0d1a", borderTop: "1px solid #1a1a2e",
                        borderBottom: "1px solid #1a1a2e", color: "#A78BFA", fontSize: 10,
                        fontWeight: 700, letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {formatDateHeader(group.date)}
                        <span style={{ color: "#444", fontWeight: 400, marginLeft: 8 }}>
                          {group.rows.length} application{group.rows.length === 1 ? "" : "s"}
                        </span>
                      </td>
                    </tr>
                    {group.rows.map((app, i) => {
                      const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.Pending;
                      return (
                        <tr key={app.id} className="row-hover" style={{
                          borderBottom: i < group.rows.length - 1 ? "1px solid #111122" : "none",
                          background: "#080810",
                        }}>
                          <td style={{ padding: "11px 12px", fontWeight: 600, color: "#E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={app.company}>{app.company}</td>
                          <td style={{ padding: "11px 12px", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={app.role}>{app.role}</td>
                          <td style={{ padding: "11px 12px" }}><StatusBadge status={app.status} /></td>
                          <td style={{ padding: "11px 12px", color: "#555" }}>{app.dateApplied || "—"}</td>
                          <td style={{ padding: "11px 12px" }}>
                            {app.jobLink
                              ? <a href={app.jobLink} target="_blank" rel="noreferrer" style={{ color: "#22D3EE", textDecoration: "none", fontSize: 11 }}>View ↗</a>
                              : <span style={{ color: "#333" }}>—</span>}
                          </td>
                          <td style={{ padding: "11px 12px" }}>
                            {app.resumeLink
                              ? <a href={app.resumeLink} target="_blank" rel="noreferrer" style={{ color: "#4ADE80", textDecoration: "none", fontSize: 11 }}>Open ↗</a>
                              : <span style={{ color: "#333" }}>—</span>}
                          </td>
                          <td style={{ padding: "11px 12px" }}>
                            {app.notes
                              ? <button onClick={() => setNotesModal(app)} style={{ fontSize: 11, color: "#FBBF24", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>View</button>
                              : <span style={{ color: "#333" }}>—</span>}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <select value={app.status} onChange={e => handleStatusChange(app.id, e.target.value)}
                              style={{ fontSize: 11, border: `1px solid ${cfg.border}`, borderRadius: 6, padding: "4px 6px", background: cfg.bg, color: cfg.color, cursor: "pointer", width: "100%", fontFamily: "'JetBrains Mono', monospace" }}>
                              {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => openEdit(app)} className="action-btn" style={{ fontSize: 11, background: "none", border: "1px solid #222", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#666" }}>Edit</button>
                              <button onClick={() => setDeleteConfirm(app.id)} className="action-btn" style={{ fontSize: 11, background: "none", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#F87171" }}>Del</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3, color: "#fff", marginBottom: 18 }}>
          {editId ? "EDIT APPLICATION" : "ADD APPLICATION"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <FormField label="Company *">
            <input value={form.company} onChange={e => updateForm("company", e.target.value)} placeholder="e.g. Google" style={inputStyle} />
          </FormField>
          <FormField label="Role *">
            <input value={form.role} onChange={e => updateForm("role", e.target.value)} placeholder="e.g. Software Engineer" style={inputStyle} list="roles-list" />
            <datalist id="roles-list">{ROLES.map(r => <option key={r} value={r} />)}</datalist>
          </FormField>
          <FormField label="Status">
            <select value={form.status} onChange={e => updateForm("status", e.target.value)} style={inputStyle}>
              {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Date Applied">
            <input type="date" value={form.dateApplied} onChange={e => updateForm("dateApplied", e.target.value)} style={inputStyle} />
          </FormField>
        </div>
        <FormField label="Job Posting Link">
          <input value={form.jobLink} onChange={e => updateForm("jobLink", e.target.value)} placeholder="https://..." style={inputStyle} />
        </FormField>
        <FormField label="Resume Link">
          <input value={form.resumeLink} onChange={e => updateForm("resumeLink", e.target.value)} placeholder="https://drive.google.com/..." style={inputStyle} />
        </FormField>
        <FormField label="Notes">
          <textarea value={form.notes} onChange={e => updateForm("notes", e.target.value)} placeholder="Recruiter contact, interview notes, referral…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </FormField>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={() => setModalOpen(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #222", background: "none", cursor: "pointer", fontSize: 12, color: "#555", letterSpacing: 1 }}>CANCEL</button>
          <button onClick={handleSubmit} disabled={!form.company.trim() || !form.role.trim()} className="action-btn"
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#A78BFA", color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: (!form.company.trim() || !form.role.trim()) ? 0.35 : 1, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2 }}>
            {editId ? "SAVE CHANGES" : "ADD APPLICATION"}
          </button>
        </div>
      </Modal>

      {/* Notes Modal */}
      <Modal open={!!notesModal} onClose={() => setNotesModal(null)}>
        {notesModal && <>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, color: "#FBBF24", marginBottom: 2 }}>{notesModal.company}</div>
          <p style={{ margin: "0 0 1rem", fontSize: 11, color: "#555", letterSpacing: 1 }}>{notesModal.role}</p>
          <p style={{ fontSize: 13, color: "#ccc", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{notesModal.notes}</p>
          <div style={{ textAlign: "right", marginTop: 14 }}>
            <button onClick={() => setNotesModal(null)} style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #222", background: "none", cursor: "pointer", fontSize: 12, color: "#555" }}>CLOSE</button>
          </div>
        </>}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, color: "#F87171", marginBottom: 8 }}>DELETE APPLICATION?</div>
        <p style={{ fontSize: 13, color: "#555", margin: "0 0 1.25rem" }}>This can't be undone.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => setDeleteConfirm(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #222", background: "none", cursor: "pointer", fontSize: 12, color: "#555" }}>CANCEL</button>
          <button onClick={() => handleDelete(deleteConfirm)} className="action-btn" style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#F87171", color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2 }}>DELETE</button>
        </div>
      </Modal>
    </div>
  );
}



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
    const data = raw ? JSON.parse(raw) : fallback
    if (!Array.isArray(data)) return fallback
    // Repair missing/duplicate ids so every row has a unique, stable id.
    // (Old cached data without ids would make every row share `undefined`,
    // causing edits in one row to apply to every row.)
    const seen = new Set()
    return data.map((item, i) => {
      let id = item.id
      if (id === undefined || id === null || seen.has(id)) {
        id = `${key}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      }
      seen.add(id)
      return { ...item, id }
    })
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

function ProfileRow({ item, onSave, onRemove }) {
  const [editingUrl,  setEditingUrl]  = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [draftUrl,  setDraftUrl]  = useState(item.url)
  const [draftName, setDraftName] = useState(item.name)

  function commitUrl()  { onSave(item.id, { url: draftUrl });   setEditingUrl(false)  }
  function commitName() { onSave(item.id, { name: draftName }); setEditingName(false) }

  return (
    <tr>
      <td className="profile-name">
        {editingName ? (
          <input
            className="profile-input"
            value={draftName}
            autoFocus
            placeholder="Platform name…"
            onChange={e => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => e.key === 'Enter' && commitName()}
            style={{ width: '100%' }}
          />
        ) : (
          <span
            title="Click to rename"
            style={{ cursor: 'pointer', display: 'inline-block', padding: '2px 4px', borderRadius: 4 }}
            className="profile-name-editable"
            onClick={() => { setDraftName(item.name); setEditingName(true) }}
          >
            {item.name}
          </span>
        )}
      </td>
      <td className="profile-url-cell">
        {editingUrl ? (
          <input
            className="profile-input"
            value={draftUrl}
            autoFocus
            placeholder="https://…"
            onChange={e => setDraftUrl(e.target.value)}
            onBlur={commitUrl}
            onKeyDown={e => e.key === 'Enter' && commitUrl()}
          />
        ) : item.url ? (
          <a href={item.url} target="_blank" rel="noreferrer" className="profile-link">{item.url}</a>
        ) : (
          <span className="placeholder">— not set —</span>
        )}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <button className="edit-btn" onClick={() => { setDraftUrl(item.url); setEditingUrl(true) }}>
          {item.url ? 'Edit' : 'Add'}
        </button>
        <button
          className="remove-btn"
          onClick={() => onRemove(item.id)}
          title="Remove row"
          style={{ marginLeft: 6, fontSize: '0.75rem' }}
        >✕</button>
      </td>
    </tr>
  )
}

function JobProfilesSection() {
  const [platforms, setPlatforms] = useState(() => load('platforms', DEFAULT_PLATFORMS.map((p, i) => ({ ...p, id: i + 1 }))))
  const [companies, setCompanies] = useState(() => load('companies', DEFAULT_COMPANIES.map((c, i) => ({ ...c, id: i + 100 }))))

  useEffect(() => save('platforms', platforms), [platforms])
  useEffect(() => save('companies', companies), [companies])

  function updateItem(list, setList, id, changes) {
    setList(list.map(i => i.id === id ? { ...i, ...changes } : i))
  }
  function removeItem(list, setList, id) {
    setList(list.filter(i => i.id !== id))
  }
  function addItem(list, setList, namePlaceholder) {
    setList([...list, { id: Date.now(), name: namePlaceholder, url: '' }])
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
                <ProfileRow
                  key={p.id}
                  item={p}
                  onSave={(id, changes) => updateItem(platforms, setPlatforms, id, changes)}
                  onRemove={(id) => removeItem(platforms, setPlatforms, id)}
                />
              ))}
            </tbody>
          </table>
          <button className="add-resume-btn" style={{ marginTop: '0.75rem', width: '100%' }}
            onClick={() => addItem(platforms, setPlatforms, 'New Platform')}>
            + Add Platform
          </button>
        </div>

        <div className="profiles-table-wrap">
          <h3>Company Portals</h3>
          <table className="profiles-table">
            <thead><tr><th>Company</th><th>Profile / Careers URL</th><th></th></tr></thead>
            <tbody>
              {companies.map(c => (
                <ProfileRow
                  key={c.id}
                  item={c}
                  onSave={(id, changes) => updateItem(companies, setCompanies, id, changes)}
                  onRemove={(id) => removeItem(companies, setCompanies, id)}
                />
              ))}
            </tbody>
          </table>
          <button className="add-resume-btn" style={{ marginTop: '0.75rem', width: '100%' }}
            onClick={() => addItem(companies, setCompanies, 'New Company')}>
            + Add Company
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Goal section ─────────────────────────────────────────────────────────────

const GOAL_TABS = [
  { key: "routine",   label: "Daily Routine",   color: "#22D3EE" },
  { key: "skills",    label: "Skills To Know",  color: "#4ADE80" },
  { key: "interview", label: "Interview Prep",  color: "#A78BFA" },
];

const DAILY_ROUTINE = [
  { time: "30 MIN", color: "#22D3EE", title: "Job search", text: "LinkedIn, Naukri, Internshala, company career pages. Filter by fresher / 0-1 yrs. Save every matching JD." },
  { time: "45 MIN", color: "#F97316", title: "Apply", text: "8-10 applications minimum per day. Tailor resume per role type — support vs analyst vs SWE." },
  { time: "45 MIN", color: "#4ADE80", title: "Skill building", text: "Rotate daily — networking basics, OS troubleshooting, SQL practice, ticketing tools, Excel formulas." },
  { time: "30 MIN", color: "#A78BFA", title: "Interview prep", text: "Pick 3 questions, answer out loud or on paper. Saying it out loud catches awkward phrasing early." },
  { time: "ONGOING", color: "#FBBF24", title: "Track everything", text: "Company, role, date applied, status. Follow up after 5-7 days of silence." },
];

const SKILL_GROUPS = [
  { title: "Operating Systems & Hardware", color: "#22D3EE", items: ["Windows OS troubleshooting", "Basic Linux commands", "Printer / peripheral setup", "Driver installation", "BIOS basics"] },
  { title: "Networking", color: "#4ADE80", items: ["TCP/IP basics", "DNS, DHCP", "VPN troubleshooting", "ping, tracert, ipconfig", "Wi-Fi troubleshooting"] },
  { title: "Ticketing & Support Tools", color: "#F97316", items: ["ServiceNow (concept)", "Freshdesk / Zendesk (concept)", "Remote Desktop / AnyDesk", "SLA tracking", "Incident logging"] },
  { title: "Data Analyst Track", color: "#A78BFA", items: ["Advanced Excel (Pivot, XLOOKUP)", "SQL joins & group by", "Power BI basics", "Python (Pandas)"] },
  { title: "Associate SWE Track", color: "#FBBF24", items: ["DSA fundamentals", "OOP concepts", "Git / GitHub", "REST API basics"] },
  { title: "Soft Skills", color: "#F87171", items: ["Clear verbal communication", "Calm under pressure", "Active listening", "Documentation habit"] },
];

const INTERVIEW_QA = [
  { cat: "Technical", color: "#22D3EE", items: [
    { q: "A user says their internet isn't working. Walk me through how you'd troubleshoot it.", a: "Ask what exactly is happening first — no internet at all, or just one site. Check if Wi-Fi shows connected, run ipconfig for an IP address, ping google.com to see if it's DNS or full connection. If it's just one user, check their cable/adapter. If it's everyone, escalate to network team." },
    { q: "How would you fix a printer that's not responding to print jobs?", a: "Check the printer is online and not showing its own error. Check the print queue — clear stuck jobs and restart the print spooler service. If it's a network printer, ping its IP. Check the driver is correct, especially after a Windows update." },
    { q: "What's the difference between DNS and DHCP?", a: "DHCP gives your device an IP address automatically when it connects. DNS turns a website name into the IP address computers actually understand. DHCP gets you onto the network, DNS gets you to the right place once you're on it." },
    { q: "A laptop is running very slow. What steps would you take to diagnose it?", a: "Open Task Manager and check CPU, memory, disk usage. High disk usage — check background updates or antivirus scans. High memory — check startup programs. Check free storage space. Run a malware scan if it's still slow." },
    { q: "How do you prioritize multiple tickets that all seem urgent?", a: "Look at actual business impact — one person's email issue is lower priority than something affecting a whole team or client-facing system. Check SLA deadlines. If two are equal, communicate timing honestly instead of going silent on one." },
  ]},
  { cat: "Behavioral", color: "#4ADE80", items: [
    { q: "Tell me about a time you had to explain something technical to a non-technical person.", a: "During my internship I explained an intermittent API failure using a phone-call-drops analogy instead of error logs — it clicked immediately, and we agreed on adding a retry mechanism." },
    { q: "How do you handle a frustrated or angry user on a support call?", a: "Let them finish explaining without interrupting — most people calm down once heard. Acknowledge the frustration honestly, then move into troubleshooting. Their frustration is with the problem, not with me." },
    { q: "Describe a time you couldn't solve a problem immediately — what did you do?", a: "An API kept timing out randomly on my medicine search app. I stopped guessing, started logging every request, and found a missing database index under load. Fixed it, response time dropped under 200ms." },
    { q: "How do you stay organized when handling multiple issues at once?", a: "Keep a simple list sorted by urgency and deadline, update it the moment something changes instead of trying to remember everything." },
  ]},
  { cat: "Data Analyst", color: "#A78BFA", items: [
    { q: "Walk me through how you'd clean a messy dataset before analysis.", a: "Check nulls and duplicates first, then data types — like making sure dates are stored as dates, not text. Look for inconsistent category spellings. Did exactly this on a ~48k record movie dataset before building anything on top." },
    { q: "What's the difference between INNER JOIN and LEFT JOIN?", a: "INNER JOIN only returns rows with a match in both tables. LEFT JOIN keeps every row from the left table and fills blanks with NULL if there's no match on the right." },
    { q: "How would you identify which customer segment to target for a discount offer?", a: "Look at purchase frequency and recency — customers who used to buy often but stopped recently are the best target. Check average order value to avoid discounting people who'd buy at full price anyway." },
  ]},
  { cat: "Associate SWE", color: "#FBBF24", items: [
    { q: "Explain a project from your resume — what was the hardest bug you fixed?", a: "On my medicine search app, the frontend showed stale results after filtering because useEffect wasn't re-running on filter change. Fixed it by adding the filter values to the dependency array." },
    { q: "What's the difference between SQL and NoSQL databases?", a: "SQL stores data in fixed tables with a defined schema upfront. NoSQL stores data more flexibly, usually as documents, so records don't need identical fields. Used MongoDB for varying medicine fields, SQL for structured data." },
    { q: "How does your app handle errors if the API call fails?", a: "Frontend wraps API calls in try-catch and shows a clear error message instead of breaking silently. Backend returns a proper error status instead of crashing. Added basic logging to see failures in production." },
  ]},
  { cat: "Always Asked", color: "#F87171", items: [
    { q: "Why IT support / service desk, given your background is full-stack development?", a: "I built real apps and did real debugging during my internship and projects, and realized I enjoy troubleshooting more than writing new features. Support roles let me use that root-cause thinking daily while getting hands-on industry experience early." },
    { q: "Are you okay working in shifts, including night shifts?", a: "Yes. Support roles run round the clock since users and clients aren't only active during the day — I'd rather start with full flexibility than limit my options this early." },
  ]},
];

function GoalSection() {
  const [activeTab, setActiveTab] = useState("routine");
  const [openQ, setOpenQ] = useState(null);

  return (
    <section id="goal" style={{
      maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1rem",
      fontFamily: "'JetBrains Mono', monospace", color: "#E2E8F0", background: "#080810",
    }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 4,
        color: "#fff", marginBottom: 4,
      }}>GOAL</div>
      <p style={{ fontSize: "0.75rem", color: "#444", letterSpacing: 1.5, marginBottom: "1.5rem", textTransform: "uppercase" }}>
        IT Support / Service Desk — locked focus
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {GOAL_TABS.map(t => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setOpenQ(null); }}
              style={{
                background: active ? `${t.color}22` : "#0d0d1a",
                border: `1px solid ${active ? t.color : "#1a1a2e"}`,
                color: active ? t.color : "#888",
                borderRadius: 20, padding: "7px 16px", fontSize: 12, fontWeight: 600,
                letterSpacing: 1, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                boxShadow: active ? `0 0 12px ${t.color}22` : "none",
                transition: "all 0.15s",
              }}
            >{t.label}</button>
          );
        })}
      </div>

      {activeTab === "routine" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DAILY_ROUTINE.map((step, i) => (
            <div key={i} style={{
              display: "flex", gap: 14, alignItems: "flex-start",
              background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 10,
              padding: "0.9rem 1.1rem",
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: step.color, background: `${step.color}18`,
                border: `1px solid ${step.color}40`, borderRadius: 6, padding: "4px 10px",
                whiteSpace: "nowrap", minWidth: 78, textAlign: "center", letterSpacing: 0.5,
              }}>{step.time}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 3 }}>{step.title}</div>
                <div style={{ fontSize: 12.5, color: "#999", lineHeight: 1.6 }}>{step.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "skills" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
          {SKILL_GROUPS.map((g, i) => (
            <div key={i} style={{
              background: "#0d0d1a", border: `1px solid ${g.color}30`, borderRadius: 10,
              padding: "0.9rem 1rem",
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: g.color, letterSpacing: 1,
                textTransform: "uppercase", marginBottom: 10,
              }}>{g.title}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {g.items.map((s, j) => (
                  <span key={j} style={{
                    fontSize: 11.5, color: g.color, background: `${g.color}14`,
                    border: `1px solid ${g.color}35`, borderRadius: 20, padding: "4px 10px",
                  }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "interview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {INTERVIEW_QA.map((group, gi) => (
            <div key={gi}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: group.color, letterSpacing: 1.5,
                textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: group.color, display: "inline-block" }} />
                {group.cat}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {group.items.map((item, qi) => {
                  const id = `${gi}-${qi}`;
                  const open = openQ === id;
                  return (
                    <div key={id} style={{
                      background: "#0d0d1a", border: `1px solid ${open ? group.color + "50" : "#1a1a2e"}`,
                      borderRadius: 10, overflow: "hidden", transition: "border-color 0.15s",
                    }}>
                      <div
                        onClick={() => setOpenQ(open ? null : id)}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "0.7rem 1rem", cursor: "pointer", gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 12.5, color: "#E2E8F0", lineHeight: 1.5 }}>{item.q}</span>
                        <span style={{ color: group.color, fontSize: 11, flexShrink: 0 }}>{open ? "−" : "+"}</span>
                      </div>
                      {open && (
                        <div style={{
                          padding: "0 1rem 0.9rem", fontSize: 12.5, color: "#999", lineHeight: 1.7,
                          borderTop: "1px solid #1a1a2e", paddingTop: 10,
                        }}>{item.a}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  return (
    <>
      <JobTracker />

      <GoalSection />

      <JobProfilesSection />
      <style>{`
        /* ── Shared section layout ─────────────────────────────── */
        #resumes, #job-profiles {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2.5rem 1rem;
          font-family: 'JetBrains Mono', monospace;
          color: #E2E8F0;
          background: #080810;
        }
        #resumes h2, #job-profiles h2 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem;
          letter-spacing: 4px;
          color: #fff;
          margin-bottom: 0.25rem;
        }
        .section-sub {
          font-size: 0.75rem;
          color: #444;
          letter-spacing: 1.5px;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
        }

        /* ── Resume cards ──────────────────────────────────────── */
        .resume-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-bottom: 1.2rem;
        }
        .resume-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #0d0d1a;
          border: 1px solid #1a1a2e;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          flex-wrap: wrap;
          transition: border-color 0.15s;
        }
        .resume-card:hover { border-color: rgba(167,139,250,0.4); }
        .resume-name {
          flex: 1;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          min-width: 120px;
          padding: 3px 6px;
          border-radius: 6px;
          color: #E2E8F0;
          letter-spacing: 0.5px;
        }
        .resume-name:hover { background: rgba(167,139,250,0.08); }
        .resume-link-edit {
          flex: 2;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 3px 6px;
          border-radius: 6px;
          min-width: 140px;
          color: #555;
        }
        .resume-link-edit:hover { background: rgba(167,139,250,0.08); }
        .resume-link-edit a { color: #22D3EE; text-decoration: none; }
        .resume-link-edit a:hover { text-decoration: underline; }
        .resume-input, .link-input {
          flex: 1;
          background: #111122;
          border: 1px solid #1a1a2e;
          border-radius: 8px;
          padding: 0.35rem 0.7rem;
          color: #E2E8F0;
          font-size: 0.85rem;
          font-family: 'JetBrains Mono', monospace;
          min-width: 160px;
          outline: none;
        }
        .resume-input:focus, .link-input:focus {
          border-color: #333;
          box-shadow: 0 0 0 2px rgba(167,139,250,0.15);
        }
        .link-input { flex: 2; }
        .placeholder { color: #333; font-style: italic; font-size: 0.8rem; }
        .remove-btn {
          background: none;
          border: none;
          color: #F87171;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0 4px;
          opacity: 0.5;
          transition: opacity 0.15s;
        }
        .remove-btn:hover { opacity: 1; }
        .add-resume-btn {
          background: none;
          border: 1px dashed #1a1a2e;
          border-radius: 10px;
          color: #444;
          cursor: pointer;
          padding: 0.6rem 1.4rem;
          font-size: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 2px;
          text-transform: uppercase;
          transition: all 0.15s;
        }
        .add-resume-btn:hover {
          border-color: rgba(167,139,250,0.4);
          color: #A78BFA;
          background: rgba(167,139,250,0.05);
        }

        /* ── Job profiles grid ─────────────────────────────────── */
        .profiles-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 680px) {
          .profiles-grid { grid-template-columns: 1fr; }
        }
        .profiles-table-wrap h3 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1rem;
          letter-spacing: 3px;
          color: #A78BFA;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }
        .profiles-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
          border: 1px solid #1a1a2e;
          border-radius: 10px;
          overflow: hidden;
        }
        .profiles-table th {
          text-align: left;
          padding: 0.5rem 0.75rem;
          background: #0d0d1a;
          border-bottom: 1px solid #1a1a2e;
          color: #444;
          font-weight: 600;
          font-size: 0.7rem;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .profiles-table td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #111122;
          vertical-align: middle;
          background: #080810;
        }
        .profiles-table tr:last-child td { border-bottom: none; }
        .profiles-table tr:hover td { background: #0d0d1a; }
        .profile-name { font-weight: 600; white-space: nowrap; color: #E2E8F0; }
        .profile-name-editable:hover { background: rgba(167,139,250,0.1); }
        .profile-url-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .profile-link { color: #22D3EE; text-decoration: none; font-size: 0.78rem; }
        .profile-link:hover { text-decoration: underline; }
        .profile-input {
          width: 100%;
          background: #111122;
          border: 1px solid #1a1a2e;
          border-radius: 6px;
          padding: 0.3rem 0.6rem;
          color: #E2E8F0;
          font-size: 0.78rem;
          font-family: 'JetBrains Mono', monospace;
          outline: none;
        }
        .profile-input:focus {
          border-color: #333;
          box-shadow: 0 0 0 2px rgba(167,139,250,0.15);
        }
        .edit-btn {
          background: none;
          border: 1px solid #1a1a2e;
          border-radius: 6px;
          color: #555;
          cursor: pointer;
          font-size: 0.7rem;
          font-family: 'JetBrains Mono', monospace;
          padding: 0.2rem 0.6rem;
          letter-spacing: 1px;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .edit-btn:hover {
          border-color: rgba(167,139,250,0.4);
          color: #A78BFA;
          background: rgba(167,139,250,0.08);
        }
      `}</style>
    </>
  )
}

export default App
