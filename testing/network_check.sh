#!/bin/bash

# Define the domain and IP address
DOMAIN="gitlab.lan"
IP_ADDRESS="192.168.68.67"
PORT=80

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Ensure necessary commands are available
for cmd in nc curl ping; do
    if ! command_exists "$cmd"; then
        echo "Error: $cmd is not installed."
        exit 1
    fi
done

# Check if the domain resolves to the correct IP address
echo "Checking DNS resolution for $DOMAIN..."
resolved_ip=$(ping -c 1 $DOMAIN | grep PING | awk '{print $3}' | tr -d '()')
if [ "$resolved_ip" = "$IP_ADDRESS" ]; then
    echo "DNS resolution is correct: $DOMAIN resolves to $IP_ADDRESS"
else
    echo "DNS resolution is incorrect: $DOMAIN resolves to $resolved_ip, expected $IP_ADDRESS"
    exit 1
fi

# Check if we can reach the server using netcat
echo "Checking network connectivity to $DOMAIN on port $PORT..."
if nc -zv $DOMAIN $PORT 2>&1 | grep -q 'succeeded'; then
    echo "Network connectivity to $DOMAIN on port $PORT is successful."
else
    echo "Network connectivity to $DOMAIN on port $PORT failed."
    exit 1
fi

# Check if the server is responding with a valid HTTP response using curl
echo "Checking HTTP response from $DOMAIN..."
http_response=$(curl -o /dev/null -s -w "%{http_code}\n" http://$DOMAIN)
if [ "$http_response" = "200" ]; then
    echo "HTTP response from $DOMAIN is successful (200 OK)."
else
    echo "HTTP response from $DOMAIN failed with status code $http_response."
    exit 1
fi

# Check if the server is reachable by IP address
echo "Checking network connectivity to $IP_ADDRESS on port $PORT..."
if nc -zv $IP_ADDRESS $PORT 2>&1 | grep -q 'succeeded'; then
    echo "Network connectivity to $IP_ADDRESS on port $PORT is successful."
else
    echo "Network connectivity to $IP_ADDRESS on port $PORT failed."
    exit 1
fi

# Check if the server is responding with a valid HTTP response by IP address using curl
echo "Checking HTTP response from $IP_ADDRESS..."
http_response_ip=$(curl -o /dev/null -s -w "%{http_code}\n" http://$IP_ADDRESS)
if [ "$http_response_ip" = "200" ]; then
    echo "HTTP response from $IP_ADDRESS is successful (200 OK)."
else
    echo "HTTP response from $IP_ADDRESS failed with status code $http_response_ip."
    exit 1
fi

echo "All network connectivity checks passed successfully."

# End of script