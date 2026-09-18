# 🚀 Aura Airfare Scraper — AWS EC2 (Mumbai) Deployment Guide

This guide provides a battle-tested, foolproof roadmap to deploy the Aura airfare scraper from scratch to **100% automated 24/7 background execution** on an Amazon Web Services (AWS) EC2 instance in Mumbai (`ap-south-1`).

---

## 📌 Why AWS Mumbai (`ap-south-1`)?
* **Zero Geo-blocking**: Indian airline and OTA sites (EaseMyTrip, MakeMyTrip, Cleartrip, Ixigo, IndiGo) serve pages with <10ms latency to Mumbai IP addresses without blocking or tarpitting.
* **Adequate Hardware**: 2 vCPUs and 2 GB RAM ensure headless Chromium launches in 1–2 seconds without crashing.
* **Cost**: ~$15–$16/month on a `t3.small` instance, covered for 6 months by AWS $100 promotional credits.

---

## 1. Launching the EC2 Instance in AWS Console

1. **Log in to AWS**: [aws.amazon.com/console](https://aws.amazon.com/console)
2. **Select Region**: In the top-right navbar, select **Asia Pacific (Mumbai) `ap-south-1`**.
3. **Navigate to EC2**: Search for **EC2** and click **Launch Instance**.
4. **Configure the Instance**:
   * **Name**: `aura-scraper`
   * **OS (AMI)**: **Ubuntu Server 24.04 LTS (HVM)**, SSD Volume Type.
     *(Avoid daily/experimental preview releases like 26.04 "Resolute" which ship with unstable alpha Python 3.14).*
   * **Instance type**: `t3.small` (2 vCPU, 2 GiB RAM) *(or `t3.micro` for free tier)*.
   * **Key pair**: Create a new key pair or select existing (e.g. `aura-key.pem`).
   * **Network Settings**: Leave default, check **"Allow SSH traffic from Anywhere"**.
   * **Storage**: Change from `8 GiB` to **`20 GiB`** (gp3 SSD).
5. Click **Launch instance** and wait until *Instance state* turns **Running** (green).

---

## 2. Connecting to the Instance
1. In the EC2 Instances dashboard, select `aura-scraper`.
2. Click **Connect** (top bar).
3. Select **EC2 Instance Connect** and click the orange **Connect** button.
   *(A black terminal will open right inside your web browser).*

---

## 3. Universal 1-Click Bootstrap Script (Zero Compilation)

This script installs `git`, installs official standalone **Python 3.12** (via Astral `uv`), clones the repository, installs all pre-built `.whl` dependencies (zero C++ compilation), installs Chromium with system dependencies, and writes the `.env` database configuration:

Copy and paste this entire block into the EC2 terminal:

```bash
# 1. Install git & system utilities
sudo apt update && sudo apt install -y git curl

# 2. Install Astral uv (guarantees clean standalone Python 3.12 on any Linux distribution)
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# 3. Clone the repository
cd ~
git clone https://github.com/Harshraj9142/Aura.git
cd Aura/scraper

# 4. Create an isolated Python 3.12 virtual environment
uv venv --python 3.12 venv
source venv/bin/activate

# 5. Install all scraper dependencies (all pre-built wheels, takes 5 seconds!)
pip install -r requirements.txt

# 6. Install Chromium browser & required Linux graphics libraries
python -m playwright install --with-deps chromium

# 7. Create .env configuration with your Neon PostgreSQL DB URL
cat << 'EOF' > .env
DATABASE_URL="postgresql://neondb_owner:npg_2fJs9BIdQGLF@ep-quiet-dawn-a5axks35-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
EOF
```

---

## 4. Test a Single Live Scrape

Verify that Chromium and the Neon DB upsert pipeline execute cleanly:

```bash
cd ~/Aura/scraper
source venv/bin/activate
python main.py --run-now --source easemytrip --route DEL-BOM --advance-days 1
```

*Expected output*:
```text
🔍 Scraping easemytrip | DEL-BOM | T+1d | 2026-09-20
✅ easemytrip | DEL-BOM | T+1d | 100 fares found | 6.2s
💾 Pushing 99 fares to Neon DB for DEL-BOM/easemytrip...
✅ Successfully pushed 99 fares to DB for DEL-BOM/easemytrip (Total run fares: 99)
```

---

## 5. Setting Up 24/7 Background Automation (systemd)

To ensure the scraper runs automatically on server reboots, never stops when you close your browser, and restarts automatically in case of any transient crash, set up a **systemd service**.

### Step 5.1: Create the service file

Run this command in your EC2 terminal:

```bash
sudo bash -c 'cat << "EOF" > /etc/systemd/system/aura-scraper.service
[Unit]
Description=Aura Airfare Scraper & Hourly Scheduler Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/Aura/scraper
Environment="PATH=/home/ubuntu/Aura/scraper/venv/bin:/home/ubuntu/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"
ExecStart=/home/ubuntu/Aura/scraper/venv/bin/python main.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/aura-scraper.log
StandardError=append:/var/log/aura-scraper.log

[Install]
WantedBy=multi-user.target
EOF'
```

### Step 5.2: Create the log file and set permissions

```bash
sudo touch /var/log/aura-scraper.log
sudo chown ubuntu:ubuntu /var/log/aura-scraper.log
```

### Step 5.3: Enable and Start the Service

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service on boot
sudo systemctl enable aura-scraper

# Start the scraper service now
sudo systemctl start aura-scraper
```

---

## 6. Daily Operations & Monitoring Commands

| Action | Command |
| :--- | :--- |
| **Check service status** | `sudo systemctl status aura-scraper` |
| **View live logs in real time** | `tail -f /var/log/aura-scraper.log` |
| **Restart the service** | `sudo systemctl restart aura-scraper` |
| **Stop the service** | `sudo systemctl stop aura-scraper` |

---

## 7. Updating Code in the Future

Whenever you push updates to GitHub `main`, update your running EC2 service in 3 commands:

```bash
cd ~/Aura
git pull origin main
sudo systemctl restart aura-scraper
```

---

## 8. AWS Budget Safety Alert (Prevents Overages)

1. In AWS Console search bar, type **Billing** and select **Budgets**.
2. Click **Create budget** → choose **Zero spend budget** or **Cost budget**.
3. Set amount to **$20.00 / month**.
4. Enter your email address for threshold alerts (e.g. at 80% = $16).
5. This ensures you never exceed your $100 promotional credit.
