#!/bin/bash

# Docker entrypoint script for TFT Bible backend
# This script runs when the backend container starts and seeds the database with RIOT data

set -e

echo "🚀 Starting TFT Bible Backend Container..."

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
until mongosh --host mongodb --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  echo "⏳ MongoDB is unavailable - sleeping"
  sleep 2
done

echo "✅ MongoDB is ready!"

# Check if database is already seeded
echo "🔍 Checking if database is already seeded..."
SEED_CHECK=$(mongosh --host mongodb --eval "
  const db = db.getSiblingDB('tft_bible_dev');
  const collections = ['champions', 'traits', 'items', 'augments'];
  let totalDocs = 0;
  collections.forEach(col => {
    try {
      totalDocs += db[col].countDocuments();
    } catch (e) {
      // Collection doesn't exist yet
    }
  });
  print(totalDocs);
")

if [ "$SEED_CHECK" -gt 0 ]; then
  echo "⚠️  Database already contains $SEED_CHECK documents. Skipping seeding."
  echo "💡 If you want to reseed, drop the collections first."
else
  echo "🌱 Database is empty. Starting data seeding..."

  # Run the seed binary
  echo "📝 Running database seeder..."
  ./backend seed

  if [ $? -eq 0 ]; then
    echo "✅ Database seeding completed successfully!"
  else
    echo "❌ Database seeding failed!"
    exit 1
  fi
fi

echo "🎉 TFT Bible Backend is ready!"
echo "📊 Starting the application server..."

# Start the application
exec ./backend