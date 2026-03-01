import React, { useEffect, useMemo, useState } from "react";
import "./index.css"; // Ensure to add modern styles later

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" }
];

const API_BASE = import.meta.env.VITE_API_BASE || "";

async function api(path, options = {}, token) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(API_BASE + path, {
    ...options,
    headers,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw json || { error: "Request failed" };
  }
  return json;
}

export default function App() {
  const [lang, setLang] = useState("en");
  const [step, setStep] = useState("welcome"); // welcome, email, otp, department, service, form, upload, receipt, track
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);

  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState({}); // { docType: fileObj }

  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [error, setError] = useState(null);

  // Tracking
  const [trackId, setTrackId] = useState("");
  const [trackingData, setTrackingData] = useState(null);

  const subtitle = useMemo(() => {
    if (lang === "hi") return "सरकारी सेवाओं के लिए आवेदन करें";
    if (lang === "ta") return "அரசு சேவைகளுக்கு விண்ணப்பிக்கவும்";
    if (lang === "te") return "ప్రభుత్వ సేవలకు దరఖాస్తు చేయండి";
    return "Apply for government services";
  }, [lang]);

  useEffect(() => {
    if (step === "department") {
      api("/departments").then(d => setDepartments(d.departments || [])).catch(e => setError(e.error));
      api("/services").then(d => setServices(d.services || [])).catch(e => setError(e.error));
    }
  }, [step]);

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError(null);
    try {
      await api("/auth/otp", { method: "POST", body: JSON.stringify({ email }) });
      setStep("otp");
    } catch (e) {
      setError(e.error || "Failed to send OTP");
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError(null);
    try {
      const resp = await api("/auth/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      setToken(resp.token || null);
      setStep("department");
    } catch (e) {
      setError(e.error || "Invalid OTP");
    }
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const reqBody = {
        department: selectedService.department,
        service_type: selectedService.service_type,
        priority: "normal",
        payload: formData,
      };

      console.log("Submitting Request:", reqBody);

      const created = await api("/requests", {
        method: "POST",
        body: JSON.stringify(reqBody),
      }, token || undefined);

      // Upload required docs
      if (selectedService.required_documents && selectedService.required_documents.length > 0) {
        for (const docType of selectedService.required_documents) {
          const file = files[docType];
          if (file) {
            const form = new FormData();
            form.append("file", file);
            const uploadRes = await fetch(API_BASE + "/documents/upload", {
              method: "POST",
              body: form,
            });
            const uploadJson = await uploadRes.json();
            if (uploadRes.ok && uploadJson.object_key) {
              await api(
                `/requests/${created.id}/documents`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    filename: `${docType}_${file.name}`,
                    storage_path: uploadJson.object_key,
                    mime_type: file.type,
                    size: file.size,
                  }),
                },
                token || undefined,
              );
            }
          }
        }
      }

      setRequestId(created.id);
      setRequestStatus(created.status);
      setStep("receipt");
    } catch (e) {
      setError(e.error || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTrack(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api(`/requests/${trackId}`, {}, token || undefined);
      setTrackingData(res);
    } catch (e) {
      setError(e.error || "Request not found");
      setTrackingData(null);
    }
  }

  const renderWelcome = () => (
    <>
      <div style={styles.grid2}>
        <button style={styles.primaryBig} onClick={() => setStep("email")}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          New Application
        </button>
        <button style={styles.secondaryBig} onClick={() => setStep("track")}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          Track Status
        </button>
      </div>
    </>
  );

  const renderDepartments = () => (
    <>
      <h3 style={{ marginBottom: 16 }}>Select Department</h3>
      <div style={styles.grid3}>
        {departments.map(d => (
          <button key={d.code} style={styles.deptCard} onClick={() => {
            setSelectedDept(d);
            setStep("service");
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{d.icon === "Flame" ? "🔥" : d.icon === "Zap" ? "⚡" : d.icon === "Building2" ? "🏙️" : d.icon === "Droplets" ? "💧" : d.icon === "Recycle" ? "♻️" : d.icon === "Wrench" ? "🚧" : d.icon === "AlertTriangle" ? "🚨" : "🏛️"}</div>
            <div>{d.name}</div>
          </button>
        ))}
      </div>
      <button style={styles.backBtn} onClick={() => setStep("welcome")}>Back</button>
    </>
  );

  const renderServices = () => {
    const deptServices = services.filter(s => s.department === selectedDept.code);
    return (
      <>
        <h3 style={{ marginBottom: 16 }}>{selectedDept.name} Services</h3>
        <div style={styles.grid2}>
          {deptServices.map(s => (
            <button key={s.service_type} style={styles.serviceCard} onClick={() => {
              setSelectedService(s);
              setFormData({});
              setFiles({});
              setStep("form");
            }}>
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>{s.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{s.description}</div>
              <div style={{ marginTop: 8, fontSize: 11, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                Fee: ₹{s.fee_amount} | {s.processing_days} Days
              </div>
            </button>
          ))}
        </div>
        <button style={styles.backBtn} onClick={() => setStep("department")}>Back</button>
      </>
    );
  };

  const renderForm = () => {
    const schema = selectedService.form_schema || [];
    return (
      <form onSubmit={(e) => { e.preventDefault(); setStep("upload"); }} style={styles.form}>
        <h3 style={{ marginBottom: 8 }}>{selectedService.name}</h3>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>Please fill in the details below</div>

        {schema.map(field => (
          <label key={field.name} style={styles.label}>
            {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
            {field.type === "select" ? (
              <select
                style={styles.select}
                required={field.required}
                value={formData[field.name] || ""}
                onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
              >
                <option value="">Select...</option>
                {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : (
              <input
                style={styles.input}
                type={field.type}
                required={field.required}
                value={formData[field.name] || ""}
                onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
              />
            )}
          </label>
        ))}

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button type="button" style={{ ...styles.backBtn, flex: 1, marginTop: 0 }} onClick={() => setStep("service")}>Back</button>
          <button type="submit" style={{ ...styles.primary, flex: 2, marginTop: 0 }}>Next</button>
        </div>
      </form>
    );
  };

  const renderUpload = () => {
    const docs = selectedService.required_documents || [];
    return (
      <form onSubmit={handleSubmitRequest} style={styles.form}>
        <h3 style={{ marginBottom: 8 }}>Upload Documents</h3>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>Attach the required documents for {selectedService.name}</div>

        {docs.length === 0 ? (
          <div style={styles.noticeMuted}>No documents required for this service.</div>
        ) : (
          docs.map(doc => (
            <label key={doc} style={styles.label}>
              {doc.replace(/_/g, " ").toUpperCase()} <span style={{ color: '#ef4444' }}>*</span>
              <input
                type="file"
                required
                style={{ marginTop: 6, display: 'block' }}
                onChange={e => setFiles({ ...files, [doc]: e.target.files[0] })}
              />
            </label>
          ))
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button type="button" style={{ ...styles.backBtn, flex: 1, marginTop: 0 }} onClick={() => setStep("form")}>Back</button>
          <button type="submit" style={{ ...styles.primary, flex: 2, marginTop: 0 }} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={styles.badge}>JanSuvidha</div>
            {step !== "welcome" && step !== "email" && step !== "otp" && (
              <div style={{ fontSize: 12, opacity: 0.8 }}>Step: {step.toUpperCase()}</div>
            )}
          </div>
          <div style={styles.title}>Citizen Kiosk</div>
          <div style={styles.subtitle}>{subtitle}</div>
        </div>

        {error && <div style={styles.error}>{String(error)}</div>}

        {step === "welcome" && renderWelcome()}

        {step === "email" && (
          <form onSubmit={handleRequestOtp} style={styles.form}>
            <label style={styles.label}>
              Email address
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="button" style={{ ...styles.backBtn, flex: 1, marginTop: 0 }} onClick={() => setStep("welcome")}>Back</button>
              <button style={{ ...styles.primary, flex: 2, marginTop: 0 }} type="submit">Send OTP</button>
            </div>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <label style={styles.label}>
              Enter OTP
              <input
                style={styles.input}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
              />
            </label>
            <p style={{ fontSize: 13, opacity: 0.8, marginTop: -8 }}>OTP sent to {email}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="button" style={{ ...styles.backBtn, flex: 1, marginTop: 0 }} onClick={() => setStep("email")}>Back</button>
              <button style={{ ...styles.primary, flex: 2, marginTop: 0 }} type="submit">Verify</button>
            </div>
          </form>
        )}

        {step === "department" && renderDepartments()}
        {step === "service" && renderServices()}
        {step === "form" && renderForm()}
        {step === "upload" && renderUpload()}

        {step === "receipt" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ margin: "0 0 8px 0" }}>Application Submitted!</h2>
            <div style={styles.notice}>
              <div style={{ opacity: 0.9, marginBottom: 8 }}>Please save your Applicant ID for tracking:</div>
              <div style={{ fontSize: 18, fontFamily: "monospace", fontWeight: "bold", background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 8 }}>
                {requestId}
              </div>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: "rgba(255,255,255,0.05)", borderRadius: 8, textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ opacity: 0.7 }}>Service:</span>
                <span style={{ fontWeight: 600 }}>{selectedService?.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ opacity: 0.7 }}>Department:</span>
                <span style={{ fontWeight: 600 }}>{selectedDept?.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ opacity: 0.7 }}>Status:</span>
                <span style={{ fontWeight: 600, color: requestStatus === 'payment_pending' ? '#fbbf24' : '#10b981' }}>{requestStatus?.replace("_", " ").toUpperCase()}</span>
              </div>
            </div>

            <button style={{ ...styles.primary, marginTop: 24 }} onClick={() => setStep("welcome")}>
              Done
            </button>
          </div>
        )}

        {step === "track" && (
          <div>
            <form onSubmit={handleTrack} style={styles.form}>
              <h3 style={{ marginBottom: 8 }}>Track Status</h3>
              <label style={styles.label}>
                Request ID
                <input
                  style={styles.input}
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  placeholder="Enter UUID..."
                  required
                />
              </label>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" style={{ ...styles.backBtn, flex: 1, marginTop: 0 }} onClick={() => { setStep("welcome"); setTrackingData(null); }}>Back</button>
                <button type="submit" style={{ ...styles.primary, flex: 2, marginTop: 0 }}>Search</button>
              </div>
            </form>

            {trackingData && trackingData.request && (
              <div style={{ marginTop: 24, padding: 16, background: "rgba(255,255,255,0.05)", borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>Status</div>
                    <div style={{ fontSize: 18, fontWeight: "bold", color: "#3b82f6" }}>{trackingData.request.status.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>Date</div>
                    <div style={{ fontSize: 14 }}>{new Date(trackingData.request.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>Department</div>
                  <div>{trackingData.request.department.toUpperCase()}</div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>Service Type</div>
                  <div>{trackingData.request.service_type.toUpperCase()}</div>
                </div>

                {trackingData.documents?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>Uploaded Documents ({trackingData.documents.length})</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {trackingData.documents.map(d => (
                        <span key={d.id} style={{ fontSize: 11, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 99 }}>{d.filename}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 24, right: 24 }}>
        <select
          id="lang"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          style={{ ...styles.select, padding: "6px 10px", fontSize: 12 }}
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e1b4b)",
    padding: 24,
    fontFamily: "system-ui, -apple-system, sans-serif"
  },
  card: {
    width: "min(600px, 92vw)",
    borderRadius: 20,
    padding: 32,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "white",
    backdropFilter: "blur(12px)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
  },
  header: { marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(59,130,246,0.18)",
    border: "1px solid rgba(59,130,246,0.35)",
    fontSize: 12,
    fontWeight: "bold"
  },
  title: { fontSize: 32, fontWeight: 800, marginTop: 12, letterSpacing: -0.5 },
  subtitle: { opacity: 0.7, marginTop: 4, fontSize: 15 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 },
  primaryBig: {
    padding: "24px",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    transition: "transform 0.1s"
  },
  secondaryBig: {
    padding: "24px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s"
  },
  deptCard: {
    padding: "16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    color: "white",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "center",
  },
  serviceCard: {
    padding: "16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(59,130,246,0.05)",
    color: "white",
    cursor: "pointer",
    textAlign: "left",
  },
  label: { fontSize: 13, opacity: 0.9, fontWeight: 500 },
  select: {
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 8,
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "white"
  },
  primary: {
    marginTop: 16,
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
  },
  backBtn: {
    marginTop: 16,
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "white",
    fontWeight: 600,
    cursor: "pointer"
  },
  form: { display: "grid", gap: 16 },
  input: {
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(15,23,42,0.6)",
    color: "white",
    boxSizing: "border-box"
  },
  notice: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)"
  },
  noticeMuted: {
    padding: 16,
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    opacity: 0.9
  },
  error: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.3)",
    fontSize: 14,
    color: "#fca5a5"
  }
};
