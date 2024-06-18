#!/bin/bash

# List of hostnames and IPs
declare -A hosts
hosts=(
    ["gitlab.lan"]="192.168.68.67"
    ["rpi01.lan"]="192.168.68.82"
    ["rpi03.lan"]="192.168.68.79"
    ["rpi04.lan"]="192.168.68.76"
    ["rpi05.lan"]="192.168.68.77"
)

# Directory to store certificates
CERT_DIR="./certs"
SYSTEM_CERT_DIR="/usr/local/share/ca-certificates"
SSL_CERT_DIR="/etc/ssl/certs"
SSL_KEY_DIR="/etc/ssl/private"
mkdir -p $CERT_DIR

# Python script to start HTTPS server
HTTPS_SERVER_SCRIPT="./https_server.py"
cat <<EOF > $HTTPS_SERVER_SCRIPT
import http.server
import ssl
import sys

hostname = '0.0.0.0'
port = int(sys.argv[1])
certfile = sys.argv[2]
keyfile = sys.argv[3]
directory = sys.argv[4]

class SimpleHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

httpd = http.server.HTTPServer((hostname, port), SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket(httpd.socket, certfile=certfile, keyfile=keyfile, server_side=True)

httpd.serve_forever()
EOF

# Get the current hostname
current_hostname=$(hostname)

# Function to generate SSL certificates
generate_ssl_cert() {
    local hostname=$1
    local ip=$2

    # Generate private key
    openssl genpkey -algorithm RSA -out $CERT_DIR/$hostname.key

    # Generate certificate signing request (CSR)
    openssl req -new -key $CERT_DIR/$hostname.key -out $CERT_DIR/$hostname.csr -subj "/CN=$hostname"

    # Generate self-signed certificate
    openssl x509 -req -days 365 -in $CERT_DIR/$hostname.csr -signkey $CERT_DIR/$hostname.key -out $CERT_DIR/$hostname.crt

    echo "Generated SSL certificate for $hostname ($ip)"
}

# Function to validate the hostname
validate_hostname() {
    local hostname=$1
    local ip=$2

    if [[ $hostname == $current_hostname ]]; then
        echo "Hostname $hostname matches the current host."
        generate_ssl_cert $hostname $ip
    else
        echo "Hostname $hostname does not match the current host. Skipping SSL generation."
    fi
}

# Function to check if a port is available and identify the process using it
check_port() {
    local port=$1
    if lsof -i:$port | grep -q LISTEN; then
        echo "Port $port is currently in use by the following process(es):"
        lsof -i:$port | grep LISTEN
        exit 1
    else
        echo "Port $port is available."
    fi
}

# Function to install the certificate in the system trust store and appropriate directories
install_certificates() {
    local hostname=$1

    # Copy certificates to system directories
    sudo cp $CERT_DIR/$hostname.crt $SYSTEM_CERT_DIR/$hostname.crt
    sudo cp $CERT_DIR/$hostname.crt $SSL_CERT_DIR/$hostname.crt
    sudo cp $CERT_DIR/$hostname.key $SSL_KEY_DIR/$hostname.key

    # Update the system trust store
    sudo update-ca-certificates
    echo "Installed and updated certificates for $hostname"
}

# Validate the current host and generate SSL certificate
for hostname in "${!hosts[@]}"; do
    validate_hostname $hostname ${hosts[$hostname]}
done

# Function to validate the SSL certificate with a sample service
validate_ssl_cert() {
    local hostname=$1
    local ip=${hosts[$hostname]}
    local port=8443

    # Check if port is available
    check_port $port

    echo "Starting sample service for $hostname on port $port"
    # Use Python's built-in HTTP server to test the certificate
    mkdir -p $hostname
    echo "Hello from $hostname" > $hostname/index.html

    # Start the HTTPS server
    nohup python3 $HTTPS_SERVER_SCRIPT $port $CERT_DIR/$hostname.crt $CERT_DIR/$hostname.key $hostname > server.log 2>&1 &

    # Wait a bit for the server to start
    sleep 5

    # Check if the server is running
    if lsof -i:$port | grep -q python; then
        echo "HTTPS server is running on https://$hostname:$port"
    else
        echo "Failed to start HTTPS server on https://$hostname:$port"
        cat server.log
    fi

    # Validate the service using curl
    echo "Validating HTTPS service for $hostname"
    curl -k https://$hostname:$port

    # Additional curl tests for localhost and 127.0.0.1
    echo "Validating HTTPS service for localhost"
    curl -k https://localhost:$port

    echo "Validating HTTPS service for 127.0.0.1"
    curl -k https://127.0.0.1:$port

    # Stop the server after testing
    pkill -f "python3 $HTTPS_SERVER_SCRIPT"

    # Install the certificates
    install_certificates $hostname
}

# Validate SSL certificate with a sample service for the current host
for hostname in "${!hosts[@]}"; do
    if [[ $hostname == $current_hostname ]]; then
        validate_ssl_cert $hostname
    fi
done

echo "All operations completed."