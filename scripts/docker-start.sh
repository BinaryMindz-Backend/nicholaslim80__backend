#!/bin/bash
set -e  # exit on first error

# Determine docker compose command
if command -v docker compose &> /dev/null; then
    DC="docker compose"
elif command -v docker-compose &> /dev/null; then
    DC="docker-compose"
else
    echo "❌ Docker Compose is not installed."
    exit 1
fi

APP_SERVICE="app"       # Service name in docker-compose.yml
DB_SERVICE="db"         # Service name in docker-compose.yml

echo "🔹 Building Docker containers..."
$DC up -d --build

echo "🔹 Waiting for Postgres to be ready..."
MAX_RETRIES=30
count=0
until $DC exec -T -e PGPASSWORD=$DB_PASSWORD $DB_SERVICE pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; do
    count=$((count+1))
    if [ $count -ge $MAX_RETRIES ]; then
        echo "❌ Postgres did not become ready in time."
        exit 1
    fi
    echo "⏳ Waiting for database... ($count/$MAX_RETRIES)"
    sleep 2
done

echo "✅ Postgres is ready!"

echo "🔹 Running Prisma migrations..."
$DC exec -T -e DATABASE_URL=$DATABASE_URL $APP_SERVICE npx prisma migrate deploy

echo "🔹 Generating Prisma client..."
$DC exec -T -e DATABASE_URL=$DATABASE_URL $APP_SERVICE npx prisma generate

echo "🔹 All done! Starting app logs..."
$DC logs -f $APP_SERVICE
