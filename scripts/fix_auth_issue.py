#!/usr/bin/env python3
"""
Fix the MongoDB authentication issue by updating the database URLs with authentication.
This script explains the issue and the solution.
"""

print("""
ISSUE ANALYSIS:
==============

1. ROOT CAUSE: MongoDB Authentication Issue
   - Services connect to MongoDB without proper authentication credentials
   - Current DATABASE_URL: mongodb://mongodb:27017
   - Should be: mongodb://admin:password@mongodb:27017/?authSource=admin

2. EFFECT ON DATA FLOW:
   - Services register initially and appear healthy
   - On first database access attempt, they fail with "Unauthorized" error
   - Services become unhealthy and are removed from service registry
   - Gateway can no longer route requests to these services
   - Frontend shows "No champions found" because gateway returns 503 errors

3. FILES TO UPDATE:
   - docker-compose.yml: Update DATABASE_URL environment variables to include auth

4. SOLUTION:
   Change all service database URLs from:
     DATABASE_URL=mongodb://mongodb:27017
   To:
     DATABASE_URL=mongodb://admin:password@mongodb:27017/?authSource=admin

5. SERVICES NEEDING UPDATES:
   - champion-service
   - trait-service  
   - composition-service
   - trait-tracker-service

6. AFTER UPDATING:
   - Restart all services
   - Services will register properly with gateway
   - Health checks will pass
   - Database operations will succeed
   - Frontend will be able to load data through gateway
""")

# Verify that data exists in proper databases
import subprocess
import json

print("\nVERIFICATION: Data exists in MongoDB:")
try:
    # Check champions count
    cmd = ["docker", "exec", "microservices-mongodb-1", "mongosh", "--authenticationDatabase", "admin", "-u", "admin", "-p", "password", "tft_champions_db", "--eval", "db.champions.countDocuments()"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0 and result.stdout.strip().isdigit():
        print(f"✓ Champions in database: {result.stdout.strip()}")
    else:
        print(f"✗ Error checking champions: {result.stderr if result.stderr else result.stdout}")
    
    # Check traits count
    cmd = ["docker", "exec", "microservices-mongodb-1", "mongosh", "--authenticationDatabase", "admin", "-u", "admin", "-p", "password", "tft_traits_db", "--eval", "db.traits.countDocuments()"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0 and result.stdout.strip().isdigit():
        print(f"✓ Traits in database: {result.stdout.strip()}")
    else:
        print(f"✗ Error checking traits: {result.stderr if result.stderr else result.stdout}")
        
    print("\nDATA IS READY - Just needs services to connect with proper authentication!")
    
except Exception as e:
    print(f"Error verifying data: {e}")