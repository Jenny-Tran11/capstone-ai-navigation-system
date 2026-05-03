import React, { useState } from "react";

const NAV = [
  { icon: "▣", label: "Dashboard" },
  { icon: "◎", label: "Admins" },
  { icon: "▦", label: "Workspaces" },
  { icon: "⬡", label: "Permissions" },
  { icon: "◈", label: "Components" },
];

const STATS = [
  { label: "Admin users", value: "24", sub: "From GET /admin/list" },
  { label: "API URL", value: "staging.api", sub: "Configured in env" },
  { label: "Environment", value: "Remote", sub: "Inferred from API URL" },
  { label: "Status", value: "Active", sub: "Authenticated session", accent: true },
];

const PAYMENTS = [
  { name: "Kenneth Thompson", email: "ken99@yahoo.com", amount: "$316.00", status: "success" },
  { name: "Abraham Lincoln", email: "abe45@gmail.com", amount: "$242.00", status: "success" },
  { name: "Monserrat Rodriguez", email: "monserrat44@gmail.com", amount: "$837.00", status: "processing" },
  { name: "Silas Johnson", email: "silas22@gmail.com", amount: "$874.00", status: "success" },
];

export function Clean() {
  const [active, setActive] = useState("Dashboard");
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", background: "#fafafa", color: "#111" }}>
      <aside style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", padding: "28px 0", background: "#fff", borderRight: "1px solid #f0f0f0" }}>
        <div style={{ padding: "0 20px", marginBottom: 32, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>B</div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.03em" }}>Baseline</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 20px", marginBottom: 6 }}>Menu</div>
          {NAV.map((item) => (
            <button key={item.label} onClick={() => setActive(item.label)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 20px", border: "none", cursor: "pointer", background: active === item.label ? "#f5f5f5" : "transparent", color: active === item.label ? "#111" : "#888", fontSize: 13.5, fontWeight: active === item.label ? 600 : 400, textAlign: "left", transition: "all 0.1s", borderRight: active === item.label ? "2px solid #111" : "2px solid transparent" }}>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "0 12px" }}>
          <div style={{ padding: "10px 8px", borderRadius: 8, background: "#f5f5f5", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700 }}>A</div>
            <div><div style={{ fontSize: 12, fontWeight: 600 }}>Admin</div><div style={{ fontSize: 10.5, color: "#999" }}>admin@base.io</div></div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em" }}>Dashboard</span>
          <span style={{ fontSize: 12, color: "#888", padding: "4px 12px", border: "1px solid #eee", borderRadius: 20 }}>Admin console</span>
        </header>

        <main style={{ flex: 1, overflow: "auto", padding: 28 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 4 }}>Good morning</h2>
            <p style={{ fontSize: 13, color: "#888" }}>Signed-in overview for <span style={{ color: "#111", fontWeight: 600 }}>Baseline Core</span>. Use quick actions to manage admins.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            {STATS.map((s) => (
              <div key={s.label} style={{ padding: "18px 20px", borderRadius: 12, background: "#fff", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 11.5, color: "#aaa", marginBottom: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 4, color: s.accent ? "#16a34a" : "#111" }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: "#bbb" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ borderRadius: 12, background: "#fff", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 20, gridColumn: "span 2" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Quick actions</div>
              <div style={{ fontSize: 12, color: "#aaa", marginBottom: 16 }}>Jump to common tasks.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[{ title: "Manage admins", desc: "Invite or remove administrators.", icon: "◎" }, { title: "Components", desc: "Browse @baseline/ui primitives.", icon: "◈" }].map((a) => (
                  <div key={a.title} style={{ padding: 16, borderRadius: 10, border: "1px solid #f0f0f0", background: "#fafafa" }}>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>{a.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginBottom: 14 }}>{a.desc}</div>
                    <button style={{ fontSize: 12, padding: "6px 14px", border: "1px solid #e5e5e5", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#555", fontWeight: 500 }}>Open →</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: 12, background: "#fff", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Team members</div>
              <div style={{ fontSize: 12, color: "#aaa", marginBottom: 16 }}>Collaborate with your team.</div>
              {[{ name: "Toby Belhome", role: "Viewer" }, { name: "Jackson Lee", role: "Developer" }, { name: "Hally Gray", role: "Viewer" }].map((m) => (
                <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{m.name.split(" ").map((p) => p[0]).join("")}</div>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div></div>
                  <span style={{ fontSize: 11, color: "#888", border: "1px solid #eee", padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>{m.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: 12, background: "#fff", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>Latest payments</div><div style={{ fontSize: 12, color: "#aaa" }}>Recent transactions from customers.</div></div>
              <button style={{ fontSize: 12, padding: "5px 14px", border: "1px solid #e5e5e5", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#555" }}>Export</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#fafafa" }}>{["Customer", "Email", "Amount", "Status"].map((h) => (<th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>))}</tr></thead>
              <tbody>
                {PAYMENTS.map((p) => (
                  <tr key={p.email} style={{ borderTop: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: "11px 16px", fontSize: 12.5, color: "#888" }}>{p.email}</td>
                    <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 600 }}>{p.amount}</td>
                    <td style={{ padding: "11px 16px" }}><span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: p.status === "success" ? "#f0fdf4" : "#fefce8", color: p.status === "success" ? "#16a34a" : "#ca8a04", border: `1px solid ${p.status === "success" ? "#bbf7d0" : "#fef08a"}` }}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
