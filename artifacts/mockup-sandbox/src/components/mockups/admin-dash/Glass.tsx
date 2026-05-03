import React, { useState } from "react";

const NAV = [
  { icon: "⊞", label: "Dashboard" },
  { icon: "👥", label: "Admins" },
  { icon: "🏢", label: "Workspaces" },
  { icon: "🔑", label: "Permissions" },
  { icon: "🧩", label: "Components" },
];

const STATS = [
  { label: "Total Admins", value: "24", delta: "+3 this week", color: "#818cf8" },
  { label: "API Status", value: "Live", delta: "Staging env", color: "#34d399" },
  { label: "Environment", value: "Remote", delta: "Inferred from URL", color: "#60a5fa" },
  { label: "Session", value: "Active", delta: "Healthy", color: "#a78bfa" },
];

const PAYMENTS = [
  { name: "Kenneth Thompson", email: "ken99@yahoo.com", amount: "$316.00", status: "success" },
  { name: "Abraham Lincoln", email: "abe45@gmail.com", amount: "$242.00", status: "success" },
  { name: "Monserrat Rodriguez", email: "monserrat44@gmail.com", amount: "$837.00", status: "processing" },
  { name: "Silas Johnson", email: "silas22@gmail.com", amount: "$874.00", status: "success" },
];

export function Glass() {
  const [active, setActive] = useState("Dashboard");
  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", background: "linear-gradient(135deg, #0f0c29 0%, #1a1040 50%, #24243e 100%)", fontFamily: "'Inter', 'Geist', sans-serif", position: "relative" }}>
      <div style={{ position: "absolute", top: 80, left: 120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 100, right: 200, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

      <aside style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", padding: "24px 16px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(255,255,255,0.08)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, paddingLeft: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #818cf8, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>B</div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", letterSpacing: "-0.02em" }}>Baseline</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV.map((item) => (
            <button key={item.label} onClick={() => setActive(item.label)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: active === item.label ? "rgba(129,140,248,0.18)" : "transparent", color: active === item.label ? "#c7d2fe" : "rgba(203,213,225,0.6)", fontSize: 13.5, fontWeight: active === item.label ? 600 : 400, transition: "all 0.15s", textAlign: "left", borderLeft: active === item.label ? "2px solid #818cf8" : "2px solid transparent" }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 8px", borderRadius: 10, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 600 }}>A</div>
          <div><div style={{ fontSize: 12.5, fontWeight: 600, color: "#e2e8f0" }}>Admin</div><div style={{ fontSize: 11, color: "rgba(148,163,184,0.7)" }}>admin@base.io</div></div>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", letterSpacing: "-0.02em" }}>Dashboard</h1>
          <div style={{ fontSize: 12, color: "rgba(148,163,184,0.7)", background: "rgba(255,255,255,0.06)", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)" }}>✦ Admin console</div>
        </header>

        <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.03em", marginBottom: 4 }}>Good morning ✦</h2>
            <p style={{ fontSize: 13.5, color: "rgba(148,163,184,0.8)" }}>Signed-in overview for <span style={{ color: "#a5b4fc" }}>Baseline Core</span>. Manage admins or your profile.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            {STATS.map((s) => (
              <div key={s.label} style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 11.5, color: "rgba(148,163,184,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.04em", marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: s.color, fontWeight: 500 }}>{s.delta}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
            <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Latest payments</div><div style={{ fontSize: 12, color: "rgba(148,163,184,0.6)" }}>Recent customer transactions</div></div>
                <button style={{ fontSize: 12, color: "#a5b4fc", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", padding: "5px 12px", borderRadius: 8, cursor: "pointer" }}>Export</button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{["Customer", "Email", "Amount", "Status"].map((h) => (<th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "rgba(148,163,184,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>))}</tr></thead>
                <tbody>
                  {PAYMENTS.map((p) => (
                    <tr key={p.email} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{p.name}</td>
                      <td style={{ padding: "11px 16px", fontSize: 12.5, color: "rgba(148,163,184,0.7)" }}>{p.email}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, color: "#f1f5f9", fontWeight: 600 }}>{p.amount}</td>
                      <td style={{ padding: "11px 16px" }}><span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: p.status === "success" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)", color: p.status === "success" ? "#34d399" : "#fbbf24", border: `1px solid ${p.status === "success" ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}` }}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)", padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>Team members</div>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,0.6)", marginBottom: 16 }}>Invite your team to collaborate.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[{ name: "Toby Belhome", role: "Viewer" }, { name: "Jackson Lee", role: "Developer" }, { name: "Hally Gray", role: "Viewer" }].map((m) => (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{m.name.split(" ").map((p) => p[0]).join("")}</div>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div></div>
                    <span style={{ fontSize: 11, color: "#a5b4fc", background: "rgba(129,140,248,0.1)", padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
