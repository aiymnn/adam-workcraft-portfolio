# Root-Only VPS Deployment Guide (No-Domain / IP-Based Setup)

This is the definitive, start-to-finish guide to configure your Ubuntu VPS and deploy your Next.js + PostgreSQL application using Docker compose. This setup runs entirely under the `root` user and is configured to run on your IP address (`159.89.193.92`) without a port in the URL.

---

## Step 1: System Update & Base Configurations

Log into your server via your terminal:
```bash
ssh root@159.89.193.92
```

### 1. Update Server Packages
Immediately pull the latest security patches and updates:
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Create Swap Space (Emergency RAM)
Building Next.js inside a Docker container is memory-intensive. Setting up 2GB of virtual swap memory acts as a safety net so your build process does not crash or lock up the VPS.
```bash
# Create a 2GB empty swap file
sudo fallocate -l 2G /swapfile

# Set secure file permissions (root only)
sudo chmod 600 /swapfile

# Format the file as swap space
sudo mkswap /swapfile

# Enable the swap space
sudo swapon /swapfile

# Register it permanently so it survives server reboots
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 3. Setup the Firewall (UFW)
A firewall blocks external access to unauthorized ports. We must allow SSH (`22`), standard HTTP (`80`), and standard HTTPS (`443`).

> [!IMPORTANT]
> **CRITICAL WARNING:** You must run `sudo ufw allow 22/tcp` before enabling the firewall. If you forget to allow port 22, you will lock yourself out of SSH!

```bash
# 1. Allow SSH (Port 22)
sudo ufw allow 22/tcp

# 2. Allow HTTP & HTTPS (For web traffic and Caddy reverse proxy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 3. Turn on the firewall
sudo ufw enable
```
*(Press `y` and then `Enter` when prompted).*

---

## Step 2: Install Git, Docker, and Caddy

We will install all our required system dependencies now:
- **Git**: To clone the project repository.
- **Docker**: To run the Next.js app and Postgres database.
- **Caddy**: To reverse proxy the IP address (`http://159.89.193.92`) to Next.js on port `3000` (so you don't need to type the port in the browser).

```bash
# 1. Install Git
sudo apt install git -y

# 2. Download and run the official Docker automated installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Enable the Docker service to run automatically on system boot
sudo systemctl enable docker
sudo systemctl start docker

# 4. Install Caddy Reverse Proxy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy -y
```

Verify that they are installed correctly:
```bash
docker --version
docker compose version
caddy version
```

---

## Step 3: Clone Project & Set Up Environment

### 1. Clone Your Codebase
We will store the project inside `/root/adam-workcraft`:
```bash
cd /root
git clone <YOUR_GIT_REPOSITORY_URL> adam-workcraft
cd adam-workcraft
```

### 2. Configure Environment Variables
Copy the example environment template to `.env` (Docker Compose reads `.env` automatically to set up the container configuration):
```bash
cp .env.example .env
nano .env
```

Modify the parameters in `nano` to match your IP-based production environment (notice there is no `:3000` port in the URLs):
```env
# ==========================================
# Database Configuration
# ==========================================
# Make sure DB_HOST is set to 'db' (the docker-compose service name)
DB_HOST=db
DB_PORT=5432
DB_NAME=adam-workcraft
DB_USER=dbuser
DB_PASSWORD=YOUR_INSANELY_SECURE_PASSWORD

# Prisma URLs connecting internally inside the Docker network
DATABASE_URL=postgresql://dbuser:YOUR_INSANELY_SECURE_PASSWORD@db:5432/adam-workcraft?schema=public
DIRECT_URL=postgresql://dbuser:YOUR_INSANELY_SECURE_PASSWORD@db:5432/adam-workcraft?schema=public

# ==========================================
# Next Auth Configuration
# ==========================================
# Generate a secret by running 'openssl rand -base64 32' on your local command line and pasting it here:
AUTH_SECRET=YOUR_GENERATED_AUTH_SECRET
# Since you do not have a domain yet, use http://159.89.193.92 (no port!)
AUTH_URL=http://159.89.193.92

# ==========================================
# Admin Credentials Bootstrap
# ==========================================
# These credentials will be used to log into the admin dashboard on first login
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD
ADMIN_FULL_NAME=Adam Workcraft
ADMIN_EMAIL=aizzdevop@gmail.com

# ==========================================
# Google Drive Media Configuration
# ==========================================
GOOGLE_DRIVE_AUTH_MODE=service-account
GOOGLE_DRIVE_FOLDER_ID=YOUR_GOOGLE_DRIVE_FOLDER_ID
# Copy the entire JSON credentials from your Google Cloud Console service account key, encode it to base64, and paste it here:
GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64=YOUR_BASE64_SERVICE_ACCOUNT_JSON

# ==========================================
# Nodemailer SMTP Configuration
# ==========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=aizzdevop@gmail.com
SMTP_PASS=YOUR_GMAIL_APP_PASSWORD
CONTACT_EMAIL=aizzdevop@gmail.com

# ==========================================
# Next.js Settings
# ==========================================
# Use http://159.89.193.92 (no port!) since Caddy will proxy it
NEXT_PUBLIC_SITE_URL=http://159.89.193.92
NODE_ENV=production
```
*(Press `Ctrl+X`, then press `Y` and `Enter` to save the file and exit).*

---

## Step 4: Configure Caddy Reverse Proxy

We configure Caddy to listen to port 80 on your IP `159.89.193.92` and send all traffic to port `3000` (Next.js).

### 1. Edit Caddyfile
Open the Caddy configuration file:
```bash
sudo nano /etc/caddy/Caddyfile
```

Delete everything in the file and replace it with:
```text
http://159.89.193.92 {
    reverse_proxy localhost:3000
}
```
*(Press `Ctrl+X`, then `Y`, then `Enter` to save).*

### 2. Restart Caddy
Apply the changes:
```bash
sudo systemctl restart caddy
```

---

## Step 5: Run the Application Stack

### 1. Build and Run Containers
Compile your Next.js production image and start both the Next.js app and the Postgres database:
```bash
sudo docker compose -f docker-compose.production.yml up -d --build
```
*(This downloads Postgres, installs npm packages, and builds the Next.js production server. This will take a few minutes for the first run).*

### 2. Initialize the Database Schema
Once both containers are running, push your database tables (defined in Prisma) to the PostgreSQL database inside the container:
```bash
sudo docker exec -it adam-workcraft-app npx prisma db push
```

### 3. Verify Health
Verify both containers are running properly:
```bash
sudo docker ps
```

You can inspect the live console outputs of the app to confirm successful database connectivity:
```bash
sudo docker logs -f adam-workcraft-app
```

**🎉 Setup Complete!**
Open your web browser and navigate to:
`http://159.89.193.92`

Your site is now fully running without needing any port number in the URL! You can log into the admin panel at `http://159.89.193.92/admin` using your bootstrap credentials.

---

## Step 6: Adding a Domain & SSL (Do this later)

Once you register a domain name (e.g. `yourdomain.com`), updating it is extremely simple:

1. Add an **A Record** on your domain registrar pointing `yourdomain.com` (and optionally `www`) to `159.89.193.92`.
2. Edit `/root/adam-workcraft/.env`:
   Change the URLs to use `https` and your domain:
   ```env
   AUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```
3. Edit `/etc/caddy/Caddyfile` to use your domain:
   ```text
   yourdomain.com {
       reverse_proxy localhost:3000
   }

   www.yourdomain.com {
       redir https://yourdomain.com{uri}
   }
   ```
4. Restart Caddy and your Docker containers to apply:
   ```bash
   sudo systemctl restart caddy
   sudo docker compose -f docker-compose.production.yml restart
   ```

Caddy will automatically fetch Let's Encrypt certificates and set up secure SSL. Now you can access your website securely at `https://yourdomain.com`!

---

## Docker Cheatsheet

- **Update code:**
  ```bash
  cd /root/adam-workcraft
  git pull
  sudo docker compose -f docker-compose.production.yml up -d --build
  ```
- **Stop website:**
  ```bash
  sudo docker compose -f docker-compose.production.yml down
  ```
- **DB CLI shell access:**
  ```bash
  sudo docker exec -it adam-workcraft-db psql -U dbuser -d adam-workcraft
  ```
