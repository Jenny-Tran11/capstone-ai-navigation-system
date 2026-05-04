# Running the stack end-to-end on a VPS (Docker, weights, Cloudflare)

This guide covers: **Docker**, **YOLO weights** (not a `weights.py` file — the checkpoint is a **`.pt`**), **running services on a VPS**, **Cloudflare Tunnel** to a domain you already added to Cloudflare, and **wiring the mobile app** to a public detect URL.

Defaults in this repo (local dev):

| Service | Port | Notes |
|--------|------|--------|
| MiniStack (LocalStack-style) | `4566` | Root `docker-compose.yml`; required by `apps/api` local script |
| API (`pnpm --filter @baseline/api run start`) | `4000` | `apps/api/scripts/run-api-local.sh` |
| Web (Vite) | `5000` | `apps/web/vite.config.ts` |
| Admin (Vite) | `5001` | `apps/admin/vite.config.ts` |
| Model (FastAPI + Ultralytics) | `8080` | `apps/model/docker-compose.yml` |

Mobile detect client calls **`${EXPO_PUBLIC_DETECT_API_URL}/detect`** (see `apps/mobile/src/features/detect/detection-api.ts`). Use a **base URL with no trailing slash**, e.g. `https://detect.example.com`.

---

## 1. VPS baseline

- **OS**: Ubuntu 22.04/24.04 LTS (or similar) with SSH access.
- **Resources** (rough):
  - **Model only**: 2 vCPU, 4 GB RAM minimum (PyTorch + Ultralytics on CPU).
  - **Full monorepo** (`pnpm start:all` + MiniStack + API + Vite): prefer **4 vCPU, 8 GB+ RAM** and **Node 24+** per `package.json` engines.
- Install **Docker Engine** + **Docker Compose v2** plugin (`docker compose`).

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker "$USER"   # re-login for group to apply
```

---

## 2. Get the code on the server

```bash
git clone <your-repo-url> capstone-ai-navigation-system
cd capstone-ai-navigation-system
pnpm install
```

*(If you only need the **model** on this VPS, you can copy only `apps/model/` — see §6.)*

---

## 3. YOLO weights (`.pt`) — not committed to Git

Weights are **ignored by Git** (see root `.gitignore`: `*.pt`). You still run the same model as long as the **file is on disk** where `MODEL_PATH` points.

### Option A — Copy from your laptop

```bash
scp ./weights.pt user@YOUR_VPS_IP:~/capstone-ai-navigation-system/apps/model/weights/weights.pt
```

### Option B — Download from Roboflow

1. In [Roboflow](https://app.roboflow.com), open your project → trained **model version**.
2. Use **Download weights** (plan-dependent) or the **Python SDK** (`model.download()`). See Roboflow’s doc: [Download model weights](https://docs.roboflow.com/deploy/download-roboflow-model-weights.md).
3. `scp` the resulting `.pt` to `apps/model/weights/` as above.

### Configure the model service

On the VPS, create **`apps/model/.env`** (copy from `apps/model/.env.example`):

```env
MODEL_PATH=./weights/weights.pt
CONFIDENCE_THRESHOLD=0.4
API_KEY=your-long-random-secret
HOST=0.0.0.0
PORT=8080
```

Set **`API_KEY`** for any machine reachable from the internet. The API checks the **`X-API-Key`** header when `API_KEY` is set (`apps/model/src/api.py`).

---

## 4. Run Docker pieces

### 4a. Model service (FastAPI)

From the repo:

```bash
cd apps/model
docker compose build --no-cache model   # first time / after Dockerfile change
docker compose up -d
curl -s http://127.0.0.1:8080/health
```

Weights are mounted read-only: `./weights:/app/weights:ro` in `apps/model/docker-compose.yml`.

Restart after changing only weights:

```bash
docker compose restart model
```

### 4b. MiniStack (required for local API script)

From repo **root**:

```bash
docker compose up -d
# waits for localhost:4566
```

### 4c. Full dev stack on the VPS (optional)

Requires Docker + Node/pnpm:

```bash
cd ~/capstone-ai-navigation-system
pnpm run start:all
```

`prestart:all` checks that Docker is running; the **model** leg uses `docker compose ... up --build --remove-orphans` under `apps/model`.

**Linux note:** `apps/api/scripts/run-api-local.sh` contains macOS-specific “open Docker Desktop” logic; on a VPS, ensure Docker is already running and use the script as-is only if it behaves acceptably, or start **MiniStack** manually (§4b) then run the API from `apps/api` per that script’s expectations.

---

## 5. Smoke-test before exposing to the internet

```bash
# Health (no API key)
curl -s http://127.0.0.1:8080/health

# Detect (requires API_KEY if set)
curl -s -X POST http://127.0.0.1:8080/detect \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-long-random-secret" \
  -d '{"image_base64":"<small-valid-base64-jpeg-or-png>"}'
```

If `model_loaded` is false in `/health`, check **`MODEL_PATH`**, file permissions under `apps/model/weights/`, and container logs: `docker compose logs -f model`.

---

## 6. Minimal VPS: model + tunnel only

If you only need **phone → Cloudflare → your VPS → `/detect`**:

1. Do §1–§3–§4a–§5.
2. Do §7–§8 with a single hostname (e.g. `detect.example.com`) pointing to **`http://127.0.0.1:8080`**.
3. Set the mobile app (§9) to that HTTPS URL and the same **`EXPO_PUBLIC_DETECT_API_KEY`**.

You do **not** need the API, web, or admin on the same VPS for that path.

---

## 7. Cloudflare Tunnel (`cloudflared`)

Official reference: [Cloudflare Tunnel / Connect applications](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).

### 7a. Prerequisites on Cloudflare

1. Your **domain** is added to a Cloudflare account (**DNS** tab shows the zone).
2. **Nameservers** at your registrar point to Cloudflare (domain “active” on Cloudflare).
3. (Recommended) Use **Cloudflare Zero Trust** dashboard to manage tunnels, or use CLI + API token.

### 7b. Install `cloudflared` on the VPS

Follow Cloudflare’s install docs for your OS (e.g. Debian/Ubuntu `.deb` or their install script).

### 7c. Authenticate and create a tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create capstone-detect
```

Note the printed **tunnel UUID** and default credentials path.

### 7d. Ingress config (example)

Create e.g. `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /home/YOUR_USER/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: detect.example.com
    service: http://127.0.0.1:8080
  - service: http_status:404
```

Replace `detect.example.com` with your real hostname under the zone on Cloudflare.

### 7e. Route DNS to the tunnel

In **Zero Trust → Networks → Tunnels →** your tunnel **→ Public hostnames**, add:

- **Subdomain**: `detect` (or `@` for apex — apex has extra constraints)
- **Domain**: `example.com`
- **Service**: `http://localhost:8080` (Cloudflare UI) — equivalent to `127.0.0.1:8080` on the VPS.

Or use CLI:

```bash
cloudflared tunnel route dns capstone-detect detect.example.com
```

### 7f. Run the tunnel as a service

```bash
cloudflared tunnel run capstone-detect
```

For production, install the **systemd** unit Cloudflare documents so the tunnel survives reboots.

**TLS:** HTTPS is terminated at Cloudflare’s edge; clients use `https://detect.example.com/...`. No public port 8080 needs to be open on the VPS firewall if everything goes through the tunnel.

### 7g. Multiple services (API + model + web)

Add more `ingress` rules **above** the catch-all:

```yaml
ingress:
  - hostname: api.example.com
    service: http://127.0.0.1:4000
  - hostname: detect.example.com
    service: http://127.0.0.1:8080
  - hostname: app.example.com
    service: http://127.0.0.1:5000
  - service: http_status:404
```

Each hostname must be created in the tunnel’s **Public hostnames** and resolve via Cloudflare DNS to the tunnel.

---

## 8. “Pre-registered domain” checklist

| Step | Where |
|------|--------|
| Domain purchased | Registrar (Namecheap, Google Domains, etc.) |
| Zone on Cloudflare | Cloudflare → **Add site** → copy assigned **nameservers** |
| Point DNS to Cloudflare | Registrar → change **nameservers** to Cloudflare’s |
| Wait for propagation | Often minutes–hours |
| Tunnel hostname | Must be under that zone, e.g. `detect.example.com` |
| SSL mode | Default **Full** is typical for Tunnel origin = HTTP on localhost |

You do **not** open `80/443` on the VPS for the tunnel model path if you only use outbound `cloudflared` connections; opening 80/443 is for **reverse-proxy** setups without Tunnel.

---

## 9. Mobile app environment

In **`apps/mobile/.env`** (see `apps/mobile/.env.example`):

```env
EXPO_PUBLIC_DETECT_API_URL=https://detect.example.com
EXPO_PUBLIC_DETECT_API_KEY=your-long-random-secret
```

Must match the model service **`API_KEY`**. Rebuild/restart Expo after changes.

**iOS ATS:** Use **HTTPS** (Tunnel provides that). Plain `http://` to random hosts may be blocked.

---

## 10. Operational tips

- **Firewall (`ufw`)**: default deny; allow **SSH**; only open extra inbound ports if you are **not** using Tunnel for that service.
- **Updates**: `git pull && pnpm install` then rebuild images / restart compose as needed.
- **Class list**: If your Roboflow checkpoint uses **different classes** than `apps/model/src/config.py`, update `class_names` / `target_class_ids` so filtering matches the model.

---

## Quick reference commands

```bash
# Model
cd apps/model && docker compose up -d --build && docker compose logs -f model

# MiniStack (from repo root)
docker compose up -d

# Tunnel (foreground)
cloudflared tunnel --config ~/.cloudflared/config.yml run capstone-detect
```

This document is descriptive; Cloudflare and Roboflow UIs change over time—use their official docs for exact button names.
