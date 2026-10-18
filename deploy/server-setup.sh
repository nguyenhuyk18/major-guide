#!/usr/bin/env bash
# Run ONCE on the new EC2 server (Ubuntu 24.04):  bash majorguide/major-guide/deploy/server-setup.sh
# Installs Docker, adds 4 GB swap. Log out and back in afterwards (docker group).
set -euo pipefail

if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi
sudo systemctl enable --now docker

if ! sudo swapon --show | grep -q /swapfile; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-majorguide.conf >/dev/null
sudo sysctl --system >/dev/null

echo "Docker $(docker --version | cut -d' ' -f3) ready, swap: $(free -h | awk '/Swap/{print $2}')"
echo "Now log out (exit), ssh in again, then run: bash majorguide/major-guide/deploy/deploy.sh"
