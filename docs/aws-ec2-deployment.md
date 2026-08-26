# Deploying CivicOps to AWS EC2

This guide deploys the **entire CivicOps stack** (Frontend + Backend + PostgreSQL + Redis)
onto a single AWS EC2 instance using Docker Compose.

## Why EC2 + Docker Compose?

- **One server, everything on it** — simplest way to get a public, working demo
- **Free-tier eligible** — a `t3.micro` / `t2.micro` costs nothing for the first 12 months
- **Same containers as local** — no surprises; it runs exactly like `docker compose` on your machine

---

## Prerequisites

- An AWS account (free tier is fine) — https://aws.amazon.com
- Your code pushed to GitHub (recommended) OR you'll upload a zip

---

## Step 1 — Launch an EC2 instance

1. Log into the **AWS Console** → search **EC2** → **Launch instance**
2. **Name:** `civicops`
3. **AMI (OS):** Ubuntu Server 22.04 LTS (free tier eligible)
4. **Instance type:** `t3.small` recommended (2 GB RAM). `t2.micro` (1 GB) works but is tight — the app builds faster with 2 GB. `t3.small` may cost a few cents/hour; `t2.micro` is free-tier.
5. **Key pair:** Create a new key pair → name it `civicops-key` → download the `.pem` file (keep it safe)
6. **Network settings → Edit → Security group rules** — add these inbound rules:
   | Type | Port | Source | Purpose |
   |------|------|--------|---------|
   | SSH | 22 | My IP | Your SSH access |
   | HTTP | 80 | Anywhere (0.0.0.0/0) | Frontend |
   | Custom TCP | 4000 | Anywhere (0.0.0.0/0) | Backend API + WebSocket |
7. **Storage:** 20 GB (default 8 GB is too small for Docker builds)
8. Click **Launch instance**

After ~1 minute, note the instance's **Public IPv4 address** (e.g. `13.234.56.78`).

---

## Step 2 — Connect to the instance

From your machine (PowerShell/terminal), in the folder with your `.pem` file:

```bash
# Windows PowerShell — restrict key permissions first
icacls civicops-key.pem /inheritance:r
icacls civicops-key.pem /grant:r "$($env:USERNAME):(R)"

# SSH in (replace with your IP)
ssh -i civicops-key.pem ubuntu@13.234.56.78
```

---

## Step 3 — Install Docker on the instance

Once connected (you'll see `ubuntu@ip-...:~$`), run:

```bash
# Update and install Docker + Compose plugin
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 git
sudo usermod -aG docker ubuntu
newgrp docker   # apply group without logout

# Verify
docker --version
docker compose version
```

---

## Step 4 — Get the code onto the server

**Option A — via GitHub (recommended):**
```bash
git clone https://github.com/<your-username>/civicops.git
cd civicops
```

**Option B — upload a zip** (from your local machine, new terminal):
```bash
# zip the project locally (exclude node_modules), then:
scp -i civicops-key.pem civicops.zip ubuntu@13.234.56.78:~/
# back on the server:
sudo apt-get install -y unzip && unzip civicops.zip && cd civicops
```

---

## Step 5 — Set production secrets

Create a `.env` file on the server (Docker Compose reads it automatically):

```bash
cat > .env <<'EOF'
POSTGRES_PASSWORD=SomeStrongDbPassword123
JWT_ACCESS_SECRET=your-random-access-secret-at-least-32-characters
JWT_REFRESH_SECRET=your-random-refresh-secret-at-least-32-characters
PUBLIC_URL=http://13.234.56.78
GEMINI_API_KEY=
EOF
```

Replace `13.234.56.78` with your EC2 public IP. Generate strong secrets with:
`openssl rand -hex 32`

---

## Step 6 — Build and start everything

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This will:
- Build the backend and frontend images (~5-10 min the first time)
- Start PostgreSQL, Redis, backend, frontend
- The backend automatically runs **database migrations** and **seeds** the demo data on first start

Check status:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend   # watch backend logs
```

---

## Step 7 — Open the app

- **Frontend:** `http://<your-ec2-ip>/login`
- **Backend health:** `http://<your-ec2-ip>:4000/api/v1/health`
- **API docs:** `http://<your-ec2-ip>:4000/api/docs`

Log in with the seeded accounts (password `Password123`):
- `admin@ghmc.gov.in`, `commissioner@ghmc.gov.in`, `ward57.officer@ghmc.gov.in`, `citizen1@example.com`

---

## Managing the deployment

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart after code changes (git pull first)
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Stop everything
docker compose -f docker-compose.prod.yml down

# Stop and wipe the database (fresh start)
docker compose -f docker-compose.prod.yml down -v

# Re-run seed manually if needed
docker compose -f docker-compose.prod.yml exec backend npx ts-node prisma/seed.ts
```

---

## Cost & shutdown

- `t2.micro` = free for 12 months (750 hrs/month)
- **Stop the instance** when not demoing (EC2 → Instance state → Stop) to avoid charges
- **Terminate** it to delete completely

---

## Optional hardening (later)

- Put a domain + HTTPS in front using **Caddy** or **Nginx + Let's Encrypt**
- Move PostgreSQL to **AWS RDS** and Redis to **ElastiCache** for managed persistence
- Use **Cloudflare** in front for CDN/WAF (points DNS at your EC2 IP)
- Graduate to **ECS/Fargate** for auto-scaling (the GitHub Actions pipeline in `.github/workflows/ci.yml` is already set up for this)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build runs out of memory on t2.micro | Use `t3.small`, or add swap: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| Can't reach the site | Check the Security Group has ports 80 and 4000 open to 0.0.0.0/0 |
| Login fails | Ensure `PUBLIC_URL` in `.env` matches your EC2 IP, then rebuild |
| Backend keeps restarting | `docker compose -f docker-compose.prod.yml logs backend` — usually a DB connection or migration issue |
