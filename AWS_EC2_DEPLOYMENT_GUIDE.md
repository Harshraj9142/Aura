# 🚀 Aura Airfare Scraper — AWS EC2 (Mumbai) Deployment Guide

This guide details how to deploy the Aura airfare scraping engine from scratch to **100% automated 24/7 background execution** on an Amazon Web Services (AWS) EC2 instance.

---

## 📌 Why AWS Mumbai (`ap-south-1`)?
* **Zero Geo-blocking**: Indian airline and OTA websites (EaseMyTrip, MakeMyTrip, Cleartrip, Ixigo, IndiGo) serve pages with <10ms latency to Mumbai IP addresses without blocking or tarpitting.
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

## 3. One-Command Complete Setup Script

Once inside the EC2 terminal, copy and paste this entire block to install all system dependencies, clone the repo, set up Python, install Chromium, and configure the database:

```bash
# 1. Update OS and install system libraries
sudo apt update && sudo apt install -y python3-pip python3-venv git

# 2. Clone the repository
cd ~
git clone https://github.com/Harshraj9142/Aura.git
cd Aura/scraper

# 3. Create virtual environment and install dependencies (takes 5 seconds)
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 4. Install Chromium and all Linux browser dependencies
python3 -m playwright install --with-deps chromium

# 5. Create .env configuration with Neon PostgreSQL DB URL
cat << 'EOF' > .env
DATABASE_URL="postgresql://neondb_owner:npg_2fJs9BIdQGLF@ep-quiet-dawn-a5axks35-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
EOF
```

---

## 4. Test a Single Live Scrape

Verify that Playwright and the database connection work properly:

```bash
cd ~/Aura/scraper
source venv/bin/activate
python main.py --run-now --source easemytrip --route DEL-BOM --advance-days 1
```

*Expected output*: Finds ~100 flights in 5–10 seconds and outputs:
`✅ Successfully pushed 99 fares to DB for DEL-BOM/easemytrip`.

---

## 5. Setting Up 24/7 Background Automation (systemd)

To ensure the scraper runs continuously in the background, automatically starts on server reboots, and automatically restarts if an error occurs, create a **systemd service**.

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
Environment="PATH=/home/ubuntu/Aura/scraper/venv/bin:/usr/bin"
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
# Reload systemd to detect the new service
sudo systemctl daemon-reload

# Enable service to start automatically on system boot
sudo systemctl enable aura-scraper

# Start the scraper service now
sudo systemctl start aura-scraper
```

---

## 6. Daily Operations & Management Commands

### Check if the scraper is running:
```bash
sudo systemctl status aura-scraper
```

### View live scraper logs in real time:
```bash
tail -f /var/log/aura-scraper.log
```

### Restart the scraper (e.g. after updating code via `git pull`):
```bash
sudo systemctl restart aura-scraper
```

### Stop the scraper:
```bash
sudo systemctl stop aura-scraper
```

---

## 7. Updating Code in the Future

Whenever you make changes to the scraper and push to GitHub, update your EC2 server in 3 commands:

```bash
cd ~/Aura
git pull origin main
sudo systemctl restart aura-scraper
```

---

## 8. AWS Cost Safety Tips

1. **Set an AWS Budget**:
   * Go to **AWS Billing & Cost Management** → **Budgets** → **Create Budget**.
   * Set a monthly budget of **$20.00**.
   * Enter your email to receive an alert if your monthly forecast ever reaches 85% ($17).
2. **Instance State**:
   * If you ever want to pause scraping to save credits, simply select the instance in the EC2 Console and choose **Instance state** → **Stop instance**. You can restart it anytime with 1 click.
