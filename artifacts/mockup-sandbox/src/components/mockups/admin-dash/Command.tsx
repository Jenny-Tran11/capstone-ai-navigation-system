import React, { useState } from "react";

const NAV = [
  { cmd: "dash", label: "DASHBOARD" },
  { cmd: "admn", label: "ADMINS" },
  { cmd: "wrks", label: "WORKSPACES" },
  { cmd: "perm", label: "PERMISSIONS" },
  { cmd: "comp", label: "COMPONENTS" },
];

const STATS = [
  { key: "ADMINS", val: "24", note: "GET /admin/list" },
  { key: "API_URL", val: "staging.api", note: "REACT_APP_API_URL" },
  { key: "ENV", val: "REMOTE", note: "inferred" },
  { key: "STATUS", val: "ACTIVE", note: "session:ok", green: true },
];

const PAYMENTS = [
  { name: "K. Thompson", email: "ken99@yahoo.com", amount: "316.00", status: "OK" },
  { name: "A. Lincoln", email: "abe45@gmail.com", amount: "242.00", status: "OK" },
  { name: "M. Rodriguez", email: "monserrat44@gmail.com", amount: "837.00", status: "PENDING" },
  { name: "S. Johnson", email: "silas22@gmail.com", amount: "874.00", status: "OK" },
];

export function Command() {
  const [active, setActive] = useState("DASHBOARD");
  const now = new Date();
  const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'JetBrains Mono', 'Geist Mono', 'Fira Code', monospace", background: "#0d1117", color: "#c9d1d9", fontSize: 12 }}>
      <aside style={{ width: 190, flexShrink: 0, display: "flex", flexDirection: "column", background: "#161b22", borderRight: "1px solid #30363d" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #30363d" }}>
          <div style={{ color: "#58a6ff", fontSize: 11, marginBottom: 2 }}>▶ BASELINE/ADMIN</div>
          <div style={{ color: "#8b949e", fontSize: 10 }}>v2.0.0 · {ts}</div>
        </div>
        <nav style={{ flex: 1, padding: "8px 0" }}>
          {NAV.map((item) => (
            <button key={item.label} onClick={() => setActive(item.label)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 16px", border: "none", cursor: "pointer", background: active === item.label ? "rgba(88,166,255,0.08)" : "transparent", color: active === item.label ? "#58a6ff" : "#8b949e", fontSize: 11, fontFamily: "inherit", textAlign: "left", letterSpacing: "0.05em" }}>
              <span style={{ color: active === item.label ? "#58a6ff" : "#30363d" }}>{">"}</span>
              <span style={{ color: "#8b949e", marginRight: 4 }}>[{item.cmd}]</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #30363d" }}>
          <div style={{ color: "#8b949e", fontSize: 10, marginBottom: 4 }}># CURRENT SESSION</div>
          <div style={{ color: "#c9d1d9", fontSize: 11 }}>user: admin</div>
          <div style={{ color: "#8b949e", fontSize: 10 }}>role: superadmin</div>
          <div style={{ marginTop: 8, padding: "4px 8px", background: "rgba(63,185,80,0.1)", border: "1px solid rgba(63,185,80,0.3)", borderRadius: 4, fontSize: 10, color: "#3fb950" }}>● AUTHENTICATED</div>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ height: 38, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 16px", background: "#161b22", borderBottom: "1px solid #30363d", gap: 16 }}>
          <span style={{ color: "#58a6ff", fontSize: 11 }}>baseline/admin</span>
          <span style={{ color: "#30363d" }}>|</span>
          <span style={{ color: "#8b949e", fontSize: 10 }}>DASHBOARD</span>
          <span style={{ flex: 1 }} />
          <span style={{ color: "#3fb950", fontSize: 10 }}>● LIVE</span>
          <span style={{ color: "#8b949e", fontSize: 10 }}>{ts}</span>
        </header>

        <main style={{ flex: 1, overflow: "auto", padding: 16 }}>
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "#161b22", border: "1px solid #30363d", borderRadius: 6, borderLeft: "3px solid #58a6ff" }}>
            <div style={{ color: "#8b949e", fontSize: 10, marginBottom: 2 }}># SYSTEM LOG · {ts}</div>
            <div style={{ color: "#c9d1d9", fontSize: 12 }}>{">"} Good morning, <span style={{ color: "#58a6ff" }}>admin</span>. Baseline Core — signed-in overview.</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
            {STATS.map((s) => (
              <div key={s.key} style={{ padding: "12px 14px", background: "#161b22", border: "1px solid #30363d", borderRadius: 6 }}>
                <div style={{ color: "#8b949e", fontSize: 10, marginBottom: 8, letterSpacing: "0.08em" }}>[{s.key}]</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.green ? "#3fb950" : "#c9d1d9", letterSpacing: "-0.02em", marginBottom: 4 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "#484f58" }}># {s.note}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 14 }}>
            <div style={{ padding: "12px 14px", background: "#161b22", border: "1px solid #30363d", borderRadius: 6 }}>
              <div style={{ color: "#8b949e", fontSize: 10, marginBottom: 10, letterSpacing: "0.08em" }}># QUICK_ACTIONS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[{ cmd: "admins", title: "MANAGE_ADMINS", desc: "Invite or remove admins" }, { cmd: "components", title: "COMPONENTS", desc: "Browse @baseline/ui" }].map((a) => (
                  <div key={a.cmd} style={{ padding: "10px 12px", border: "1px solid #30363d", borderRadius: 4, background: "#0d1117" }}>
                    <div style={{ color: "#58a6ff", fontSize: 11, marginBottom: 4 }}>{">"} {a.title}</div>
                    <div style={{ color: "#8b949e", fontSize: 10, marginBottom: 10 }}>{a.desc}</div>
                    <button style={{ fontSize: 10, padding: "3px 10px", background: "rgba(88,166,255,0.1)", border: "1px solid rgba(88,166,255,0.3)", color: "#58a6ff", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}>OPEN →</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "12px 14px", background: "#161b22", border: "1px solid #30363d", borderRadius: 6 }}>
              <div style={{ color: "#8b949e", fontSize: 10, marginBottom: 10, letterSpacing: "0.08em" }}># TEAM_MEMBERS</div>
              {[{ name: "T. Belhome", role: "VIEWER", online: true }, { name: "J. Lee", role: "DEV", online: false }, { name: "H. Gray", role: "VIEWER", online: true }].map((m) => (
                <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #21262d" }}>
                  <span style={{ color: m.online ? "#3fb950" : "#484f58", fontSize: 10 }}>●</span>
                  <span style={{ flex: 1, color: "#c9d1d9", fontSize: 11 }}>{m.name}</span>
                  <span style={{ fontSize: 9, padding: "1px 6px", border: "1px solid #30363d", color: "#8b949e", borderRadius: 3 }}>{m.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #30363d", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#8b949e", fontSize: 10, letterSpacing: "0.08em" }}># PAYMENT_LOG</span>
              <button style={{ fontSize: 10, padding: "3px 10px", background: "transparent", border: "1px solid #30363d", color: "#8b949e", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}>EXPORT</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#0d1117" }}>{["NAME", "EMAIL", "AMOUNT", "STATUS"].map((h) => (<th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 9, color: "#484f58", letterSpacing: "0.1em", fontWeight: 400 }}>{h}</th>))}</tr></thead>
              <tbody>
                {PAYMENTS.map((p, i) => (
                  <tr key={p.email} style={{ borderTop: "1px solid #21262d", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "8px 14px", fontSize: 11, color: "#c9d1d9" }}>{p.name}</td>
                    <td style={{ padding: "8px 14px", fontSize: 11, color: "#8b949e" }}>{p.email}</td>
                    <td style={{ padding: "8px 14px", fontSize: 11, color: "#c9d1d9", fontWeight: 700 }}>${p.amount}</td>
                    <td style={{ padding: "8px 14px" }}><span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, fontFamily: "inherit", background: p.status === "OK" ? "rgba(63,185,80,0.1)" : "rgba(210,153,34,0.1)", color: p.status === "OK" ? "#3fb950" : "#d2993a", border: `1px solid ${p.status === "OK" ? "rgba(63,185,80,0.3)" : "rgba(210,153,34,0.3)"}` }}>{p.status}</span></td>
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
