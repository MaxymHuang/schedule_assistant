#!/bin/sh
# Generate self-signed TLS certificate for schedule.me.local

CERT_DIR="/etc/nginx/ssl"
DOMAIN="schedule.me.local"

# Create SSL directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/key.pem" \
    -out "$CERT_DIR/cert.pem" \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS:*.$DOMAIN"

# Set proper permissions
chmod 600 "$CERT_DIR/key.pem"
chmod 644 "$CERT_DIR/cert.pem"

echo "Self-signed certificate generated for $DOMAIN"

