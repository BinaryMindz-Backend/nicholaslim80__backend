#!/bin/bash
set -e  # exit on first error

# Determine correct docker compose command
if command -v docker compose &> /dev/null
then
    DC="docker compose"
else
    echo "❌ Docker Compose is not installed. Install it first."
    exit 1
fi

echo "🔹 Building Docker containers..."
$DC up -d --build

echo "🔹 Waiting for Postgres to be ready..."
MAX_RETRIES=30
count=0
until $DC exec -T -e PGPASSWORD=$DB_PASSWORD db pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; do
  count=$((count+1))
  if [ $count -ge $MAX_RETRIES ]; then
    echo "❌ Postgres did not become ready in time."
    exit 1
  fi
  echo "Waiting for database..."
  sleep 2
done

echo "🔹 Running Prisma migrations..."
$DC exec -T -e DATABASE_URL=$DATABASE_URL app npx prisma migrate deploy

echo "🔹 Generating Prisma client..."
$DC exec -T -e DATABASE_URL=$DATABASE_URL app npx prisma generate

echo "🔹 All done! Starting the app logs..."
$DC logs -f app
