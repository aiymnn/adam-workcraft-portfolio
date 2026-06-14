# The Ultimate A-to-Z VPS Deployment Guide (Docker + Next.js + Postgres)

This is the definitive, step-by-step masterclass for taking a completely blank VPS and turning it into a fortress of security, performance, and stability for your Adam Workcraft application.

We will use **Ubuntu 22.04 LTS** (or 24.04 LTS) as the operating system, as it is the industry standard for web hosting.

---

## Phase 1: Server Foundation & Security (A to Z)

When you first purchase a VPS, it is vulnerable and raw. We must secure it before installing anything.

### 1. The First Login & System Update
Log into your server via your terminal using the Root user and IP address provided by your hosting company:
```bash
ssh root@your_server_ip
```
Immediately update all the pre-installed software to patch any known security vulnerabilities:
```bash
apt update && apt upgrade -y
```

### 2. Create a Non-Root User
Running applications as `root` is extremely dangerous. We will create a dedicated user named `adam`.
```bash
adduser adam
```
*(Enter a strong password and skip the personal details by pressing Enter).*

Now, grant this user `sudo` (administrative) privileges:
```bash
usermod -aG sudo adam
```

### 3. Add Swap Space (Recommended Safety Net)
Since you are using a 4GB RAM VPS, Next.js will build comfortably without running out of memory. However, it is a Linux best practice to always have a Swap File. If an unexpected traffic spike occurs, this acts as emergency backup RAM so your server never crashes.
```bash
# Create a 2GB swap file
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make it permanent so it survives server reboots
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
```

### 4. Set Up the Firewall (UFW)
A firewall blocks all incoming traffic except what you explicitly allow. 

> **CRITICAL WARNING**: The most common mistake in server hosting is forgetting to allow SSH connections. If you turn on the firewall without allowing SSH (Port 22), **you will lock yourself out of your server permanently.**

Run these exact commands in order:
```bash
# 1. ALLOW SSH FIRST (Critical!)
ufw allow OpenSSH

# 2. Allow your application port (Port 3000)
ufw allow 3000/tcp

# 3. Allow HTTP and HTTPS (For your future domain setup)
ufw allow 80/tcp
ufw allow 443/tcp

# 4. Enable the firewall
ufw enable
```
*(Press `y` when it warns you about disrupting SSH).*

### 5. Switch to Your New User
Log out of `root` and log back in as your new, secure user:
```bash
exit
ssh adam@your_server_ip
```

---

## Phase 2: Installing Docker & Git

Docker isolates your App and Database inside "Containers". This means you never have to install Node.js, Postgres, or messy dependencies directly on your server. If a container crashes, it restarts automatically. If you move to a new server, you just copy the Docker files.

### 1. Install Git
```bash
sudo apt install git -y
```

### 2. Install Docker & Docker Compose
We will use Docker's official automated installation script:
```bash
# Download and run the installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Enable Docker to automatically start if the server reboots
sudo systemctl enable docker
sudo systemctl start docker
```

### 3. Grant Docker Permissions
By default, only `root` can run Docker commands. We will add your `adam` user to the docker group so you don't have to type `sudo docker` every time:
```bash
sudo usermod -aG docker $USER
```
> **IMPORTANT:** Type `exit` to log out of the server completely. Then `ssh adam@your_server_ip` to log back in. The permissions will now be active.

---

## Phase 3: Project Setup & Database Configuration

### 1. Download Your Code
Navigate to your home directory and clone your repository (or upload it via SFTP):
```bash
cd ~
git clone <YOUR_REPOSITORY_URL> adam-workcraft
cd adam-workcraft
```

### 2. Configure the Database and App Environment
Docker relies on a `.env` file to know what passwords to use when creating the database.
```bash
cp .env.example .env.local
nano .env.local
```

Inside the file, configure these essential sections:

**The Database Passwords:**
```env
# These tell Docker how to create the raw PostgreSQL Database
DB_NAME=adam-workcraft
DB_USER=dbuser
DB_PASSWORD=your_insanely_secure_database_password
```

**The App Connections:**
```env
# These tell Next.js how to connect to the database.
# Notice the host is 'db' instead of 'localhost'. Docker creates an internal 
# network, and 'db' is the name of the Postgres container!
DATABASE_URL=postgresql://dbuser:your_insanely_secure_database_password@db:5432/adam-workcraft?schema=public
DIRECT_URL=postgresql://dbuser:your_insanely_secure_database_password@db:5432/adam-workcraft?schema=public
```

**App Security:**
```env
AUTH_SECRET=a_very_long_random_string_of_text
NEXT_PUBLIC_SITE_URL=http://your_server_ip:3000
AUTH_URL=http://your_server_ip:3000
```
*(Press `Ctrl+X`, then `Y`, then `Enter` to save and exit).*

---

## Phase 4: Deploying the Database and App (A to Z)

Your project contains `docker-compose.production.yml`. Think of this file as the master blueprint. It tells Docker: *"Download Postgres, set the passwords from `.env.local`, start the database, then build the Next.js app, and link them together."*

### 1. Build and Start the Containers
Run this command to ignite the entire infrastructure in the background (`-d` means detached):
```bash
docker compose -f docker-compose.production.yml up -d --build
```
*(This will take a few minutes. It is downloading the OS, Postgres, Node.js, and compiling your code).*

### 2. Initialize the Database Tables
Right now, the PostgreSQL database is running, but it has no tables. We need to push your Prisma schema into it:
```bash
docker exec -it adam-workcraft-app npx prisma db push
```
*(This command acts as a bridge: It reaches inside the running Next.js container (`adam-workcraft-app`) and tells it to execute Prisma's database setup command against the running database).*

### 3. Verify Health
Check if the containers are running:
```bash
docker ps
```
Check the Next.js application logs to ensure it connected to the database successfully:
```bash
docker logs adam-workcraft-app
```

**🎉 Phase 4 Complete!**
You can now visit your application by going to `http://your_server_ip:3000` in your web browser.

---

## Phase 5: Domain Setup & SSL (Do this later)

Once you purchase a domain (e.g., `adamworkcraft.com`), follow these steps to secure it and remove the `:3000` port from the URL.

We will use **Caddy** as a reverse proxy. Caddy automatically generates, configures, and renews free SSL certificates (HTTPS) for you.

### 1. Point Your Domain (DNS)
Go to your domain registrar (Namecheap, Cloudflare, etc.) and add an **A Record**:
- **Type**: A
- **Name**: `@` (or leave blank)
- **Value**: `Your VPS IP Address`

### 2. Install Caddy
Run these commands to install Caddy:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### 3. Configure Caddy
Open the Caddy configuration file:
```bash
sudo nano /etc/caddy/Caddyfile
```

Delete everything in the file and replace it with this (change `yourdomain.com` to your actual domain):
```text
yourdomain.com {
    reverse_proxy localhost:3000
}

www.yourdomain.com {
    redir https://yourdomain.com{uri}
}
```
*(Press `Ctrl+X`, then `Y`, then `Enter` to save).*

### 4. Update Your App Environment
Now that you have a domain, tell Next.js about it:
```bash
nano .env.local
```
Change the URLs to your real domain (and use `https`):
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
AUTH_URL=https://yourdomain.com
```

### 5. Restart Services
Restart Caddy to apply the domain, and restart Docker to apply the new `.env` variables:
```bash
sudo systemctl restart caddy
docker compose -f docker-compose.production.yml restart
```

Wait a few minutes for DNS to propagate. If you visit `https://yourdomain.com`, Caddy will automatically secure it with a green padlock (SSL) and route the traffic silently into your Next.js Docker container!

---

## Docker Master Cheatsheet

If you ever need to manage your server in the future, save these commands:

- **Update your app after changing code:**
  ```bash
  git pull
  docker compose -f docker-compose.production.yml up -d --build
  ```
- **View live server logs:**
  ```bash
  docker logs -f adam-workcraft-app
  ```
- **Stop everything:**
  ```bash
  docker compose -f docker-compose.production.yml down
  ```
- **Access the raw PostgreSQL Database Shell:**
  ```bash
  docker exec -it adam-workcraft-db psql -U dbuser -d adam-workcraft
  ```
