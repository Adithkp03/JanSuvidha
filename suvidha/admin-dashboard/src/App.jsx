import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, options);
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
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle");
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [payAmount, setPayAmount] = useState("");

  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [departments, setDepartments] = useState([]);

  const columns = useMemo(
    () => [
      { key: "id", label: "Request ID" },
      { key: "department", label: "Department" },
      { key: "service_type", label: "Service" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Date" }
    ],
    []
  );

  useEffect(() => {
    // Load departments
    api("/departments").then(d => setDepartments(d.departments || [])).catch(console.error);
  }, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      setStatus("loading");
      try {
        let path = "/admin/requests?";
        if (filterDept) path += `department=${filterDept}&`;
        if (filterStatus) path += `status=${filterStatus}&`;

        const data = await api(path);
        if (!alive) return;
        setRows(Array.isArray(data?.requests) ? data.requests : []);
        setStatus("ok");
      } catch {
        if (!alive) return;
        setStatus("error");
      }
    }

    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [filterDept, filterStatus]);

  useEffect(() => {
    if (!selected) {
      setDetails(null);
      return;
    }
    let alive = true;
    (async () => {
      setLoadingDetails(true);
      try {
        const data = await api(`/requests/${selected.id}`);
        if (!alive) return;
        setDetails(data);
      } catch (e) {
        if (!alive) return;
        setActionError(e.error || "Failed to load details");
      } finally {
        if (alive) setLoadingDetails(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [selected]);

  async function updateStatus(id, newStatus) {
    setActionError(null);
    try {
      const updated = await api(`/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      // Optionally update local state instead of waiting for interval
      setRows(rows.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selected && selected.id === id) {
        setSelected({ ...selected, status: newStatus });
      }
    } catch (e) {
      setActionError(e.error || "Failed to update status");
    }
  }

  async function triggerPayment(id) {
    setActionError(null);
    const amount = Number(payAmount || 0);
    if (!amount) {
      setActionError("Enter amount first");
      return;
    }
    try {
      const pay = await api("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: id, amount, gateway: "sandbox" })
      });
      await api("/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: pay.id,
          status: "succeeded"
        })
      });
      alert("Payment generated successfully");
    } catch (e) {
      setActionError(e.error || "Failed to trigger payment");
    }
  }

  const renderButtons = () => {
    const s = selected.status;
    return (
      <div style={styles.actions}>
        {s === "submitted" && (
          <>
            <button style={styles.buttonPrimary} onClick={() => updateStatus(selected.id, "under_review")}>Mark Under Review</button>
            <button style={styles.buttonWarning} onClick={() => updateStatus(selected.id, "doc_required")}>Doc Required</button>
          </>
        )}

        {s === "under_review" && (
          <>
            <button style={styles.buttonSuccess} onClick={() => updateStatus(selected.id, "approved")}>Approve</button>
            <button style={styles.buttonDanger} onClick={() => updateStatus(selected.id, "rejected")}>Reject</button>
          </>
        )}

        {s === "approved" && (
          <>
            <button style={styles.buttonWarning} onClick={() => updateStatus(selected.id, "payment_pending")}>Request Payment</button>
            <button style={styles.buttonSuccess} onClick={() => updateStatus(selected.id, "completed")}>Mark Completed</button>
          </>
        )}

        {s === "payment_pending" && (
          <button style={styles.buttonSuccess} onClick={() => updateStatus(selected.id, "completed")}>Mark Completed</button>
        )}

      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>JanSuvidha Admin Dashboard</div>
          <div style={styles.subtitle}>
            Civic Service Request Processing Center
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select style={styles.select} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
          </select>
          <select style={styles.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="doc_required">Doc Required</option>
            <option value="approved">Approved</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div style={styles.layout}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>Live Requests</div>
            <div style={styles.pill(status)}>{status}</div>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} style={styles.th}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      style={
                        selected?.id === r.id ? styles.rowSelected : styles.row
                      }
                      onClick={() => setSelected(r)}
                    >
                      {columns.map((c) => {
                        let val = r[c.key];
                        if (c.key === "created_at") {
                          val = new Date(val).toLocaleDateString() + " " + new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        } else if (c.key === "status") {
                          val = val.replace("_", " ").toUpperCase();
                        } else {
                          val = String(val ?? "").toUpperCase();
                        }
                        return (
                          <td key={c.key} style={styles.td}>
                            {c.key === "status" ? <span style={styles.statusBadge(r.status)}>{val}</span> : val}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={styles.empty} colSpan={columns.length}>
                      No requests matched criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.detailsCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>Processing View</div>
          </div>
          {!selected && (
            <div style={styles.empty}>Select a request to process.</div>
          )}
          {selected && (
            <div style={styles.detailsBody}>
              <div style={styles.detailsRow}>
                <div style={styles.detailsLabel}>Request ID</div>
                <div style={styles.detailsValue}>{selected.id}</div>
              </div>
              <div style={styles.detailsRow}>
                <div style={styles.detailsLabel}>Status</div>
                <div style={styles.statusBadge(selected.status)}>{selected.status.replace("_", " ").toUpperCase()}</div>
              </div>
              <div style={{ display: 'flex', gap: 24, padding: "12px 0", borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={styles.detailsRow}>
                  <div style={styles.detailsLabel}>Department</div>
                  <div style={styles.detailsValue}>{selected.department.toUpperCase()}</div>
                </div>
                <div style={styles.detailsRow}>
                  <div style={styles.detailsLabel}>Service</div>
                  <div style={styles.detailsValue}>{selected.service_type.toUpperCase()}</div>
                </div>
              </div>

              {details && (
                <>
                  <div style={{ marginTop: 8 }}>
                    <div style={styles.detailsLabel}>Citizen Data Payload</div>
                    <pre style={styles.pre}>
                      {JSON.stringify(details.request?.payload || {}, null, 2)}
                    </pre>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={styles.detailsLabel}>Uploaded Documents</div>
                    {details.documents && details.documents.length > 0 ? (
                      <ul style={styles.list}>
                        {details.documents.map((d) => (
                          <li key={d.id} style={{ padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                            <span>📄 {d.filename}</span>
                            <a href={`http://localhost:9000/suvidha-docs/${d.storage_path}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>View</a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: 12, opacity: 0.6 }}>No documents uploaded.</div>
                    )}
                  </div>
                </>
              )}
              {loadingDetails && <div style={{ fontSize: 12, opacity: 0.5 }}>Loading details…</div>}

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>Workflow Actions</div>
                {renderButtons()}
              </div>

              {selected.status === "payment_pending" && (
                <div style={styles.paymentBox}>
                  <div style={styles.detailsLabel}>Generate Proxy Payment (Testing)</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <input
                      style={styles.input}
                      placeholder="Amount (INR)"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                    />
                    <button
                      style={{ ...styles.buttonPrimary, padding: '8px 16px' }}
                      onClick={() => triggerPayment(selected.id)}
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              )}

              {actionError && (
                <div style={styles.error}>{String(actionError)}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1220",
    color: "white",
    padding: "24px 32px",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    maxWidth: 1400,
    margin: "0 auto 24px auto"
  },
  title: { fontSize: 24, fontWeight: 800 },
  subtitle: { opacity: 0.6, marginTop: 6, fontSize: 13 },
  select: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(15,23,42,0.8)",
    color: "white",
    fontSize: 13
  },
  card: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    overflow: "hidden"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.2)"
  },
  cardTitle: { fontWeight: 700, fontSize: 15 },
  layout: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 24
  },
  pill: (s) => ({
    fontSize: 11,
    padding: "4px 8px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.1)",
    background:
      s === "ok"
        ? "rgba(34,197,94,0.1)"
        : s === "loading"
          ? "rgba(59,130,246,0.1)"
          : s === "error"
            ? "rgba(239,68,68,0.1)"
            : "rgba(255,255,255,0.05)"
  }),
  statusBadge: (s) => {
    let color = "#cbd5e1";
    let bg = "rgba(255,255,255,0.05)";
    if (s === "approved" || s === "completed") { color = "#10b981"; bg = "rgba(16,185,129,0.1)"; }
    else if (s === "rejected") { color = "#ef4444"; bg = "rgba(239,68,68,0.1)"; }
    else if (s === "payment_pending" || s === "doc_required") { color = "#f59e0b"; bg = "rgba(245,158,11,0.1)"; }
    else if (s === "under_review") { color = "#3b82f6"; bg = "rgba(59,130,246,0.1)"; }

    return {
      display: "inline-block",
      fontSize: 11,
      fontWeight: 600,
      padding: "4px 8px",
      borderRadius: 4,
      color,
      background: bg,
      border: `1px solid ${color}40`
    };
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "12px 20px",
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottom: "1px solid rgba(255,255,255,0.08)"
  },
  td: {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    fontSize: 13
  },
  empty: { padding: 32, opacity: 0.5, textAlign: "center", fontSize: 13 },
  row: { cursor: "pointer", transition: "background 0.1s" },
  rowSelected: {
    background: "rgba(59,130,246,0.1)",
    cursor: "pointer",
  },
  detailsCard: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0f172a",
    minHeight: 400
  },
  detailsBody: {
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    fontSize: 13
  },
  detailsRow: {
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  detailsLabel: {
    opacity: 0.5,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  detailsValue: {
    fontWeight: 500,
    fontSize: 14
  },
  pre: {
    margin: 0,
    marginTop: 6,
    padding: 12,
    borderRadius: 8,
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.05)",
    maxHeight: 250,
    overflow: "auto",
    fontSize: 12,
    color: "#a78bfa"
  },
  list: {
    margin: 0,
    marginTop: 6,
    padding: 0,
    listStyle: "none"
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  buttonPrimary: {
    padding: "8px 14px",
    borderRadius: 6,
    border: "none",
    background: "#3b82f6",
    color: "white",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  buttonSuccess: {
    padding: "8px 14px",
    borderRadius: 6,
    border: "none",
    background: "#10b981",
    color: "white",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  buttonWarning: {
    padding: "8px 14px",
    borderRadius: 6,
    border: "none",
    background: "#f59e0b",
    color: "white",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  buttonDanger: {
    padding: "8px 14px",
    borderRadius: 6,
    border: "none",
    background: "#ef4444",
    color: "white",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer"
  },
  paymentBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px dashed rgba(255,255,255,0.1)'
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.2)",
    color: "white",
    fontSize: 13
  },
  error: {
    marginTop: 12,
    padding: 12,
    borderRadius: 6,
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#fca5a5",
    fontSize: 13
  }
};
