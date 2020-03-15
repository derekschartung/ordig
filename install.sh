#!/bin/bash

# Check if running as root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# Prompt for environment


# Docker should be installed
if ! which docker > /dev/null
then
  apt-get update
  apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
  add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
   apt-get update
   apt-get install -y docker-ce
fi

# Docker compose should be installed
if ! which docker-compose >/dev/null
then
  curl -L "https://github.com/docker/compose/releases/download/1.25.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi

# WireGuard should be installed
if ! which wg > /dev/null
then
  add-apt-repository -y ppa:wireguard/wireguard
  apt-get update
  apt-get install -y wireguard
fi

# git should be installed
apt-get install -y git python3-pip

# install jinja2-cli
pip3 install jinja2-cli

# clone ordig
cd /opt
git clone https://github.com/nickadam/ordig.git

echo '
{
  "WG_NAME": "'"${WG_NAME}"'",
  "WG_IP": "'"${WG_IP}"'",
  "WG_POOL": "'"${WG_POOL}"'",
  "WG_NAMESPACE": "'"${WG_NAMESPACE}"'",
  "WG_NAMESERVER": "'"${WG_NAMESERVER}"'",
  "WG_PORT": "'"${WG_PORT}"'",
  "WG_ENDPOINT": "'"${WG_ENDPOINT}"'",
  "WG_SERVER_API_KEY": "'"${WG_SERVER_API_KEY}"'",
  "WG_CLIENT_API_KEY": "'"${WG_CLIENT_API_KEY}"'"
}
' | jinja2 docker-compose-template.yml > docker-compose.yml