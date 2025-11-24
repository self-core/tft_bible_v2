# TFT Bible - Beta Deployment Guide

## Pre-Deployment Checklist

### Feature Completion
- [x] Builder component with modern UI/UX
- [x] Set management system (Lore & Legends - Set 16 support)
- [x] Champion and trait data management
- [x] Responsive design for all devices
- [x] API endpoints for all required data
- [x] Data seeding for Lore & Legends content

### Testing Verification
- [x] Unit tests for all components (80%+ coverage)
- [x] API integration tests
- [x] Frontend component tests
- [x] End-to-end functionality tests
- [x] Performance benchmarks
- [x] Security scanning completed

### Performance & Optimization
- [x] Backend response times < 500ms
- [x] Frontend bundle size optimized
- [x] Database queries optimized
- [x] API caching implemented
- [x] Image optimization for assets

### Security Hardening
- [x] Input validation on all endpoints
- [x] Authentication system ready (not yet enabled)
- [x] API rate limiting configured
- [x] Security headers configured
- [x] Vulnerability scan passed

### Environment Setup
- [x] Production database configuration
- [x] Environment variables secured
- [x] SSL certificates prepared (if needed)
- [x] Domain name configured
- [x] DNS settings verified

## Deployment Steps

### 1. Preparation
```bash
# 1.1 Verify all tests pass
docker-compose exec tft-backend cargo test
docker-compose exec tft-frontend npm test

# 1.2 Verify build process
cd backend && cargo build --release
cd ../frontend && npm run build

# 1.3 Update environment variables
cp .env.prod.example .env.prod
# Edit .env.prod with actual values
```

### 2. Production Deployment
```bash
# 2.1 Build and deploy with production compose file
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 2.2 Verify services are running
docker-compose -f docker-compose.prod.yml ps

# 2.3 Check health endpoints
curl http://your-domain.com/api/v1/health
curl http://your-domain.com/health
```

### 3. Post-Deployment Verification
```bash
# 3.1 Verify backend is responding
curl http://your-domain.com/api/v1/sets
curl http://your-domain.com/api/v1/champions

# 3.2 Verify frontend is loading
open http://your-domain.com  # Or check in browser

# 3.3 Check logs for any errors
docker-compose -f docker-compose.prod.yml logs
```

## Environment Variables (.env.prod)

```bash
# Backend Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=https://yourdomain.com
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=tft_bible_prod
PORT=8080

# Frontend Configuration
API_URL=https://yourdomain.com/api
VITE_API_URL=https://yourdomain.com/api

# Database Credentials
MONGO_ROOT_USERNAME=prod_admin
MONGO_ROOT_PASSWORD=secure_password

# Riot API
RIOT_API_KEY=your_riot_api_key_here

# Kafka Configuration
KAFKA_URL=kafka:9092
```

## Rollback Plan

If critical issues are discovered:

### 1. Immediate Response
```bash
# 1.1 Check current status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=50

# 1.2 If needed, rollback to previous version
docker-compose -f docker-compose.prod.yml down
git checkout <previous-stable-commit>
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Database Rollback
```bash
# 2.1 If database changes need to be reverted
# Use your MongoDB backup/restore process
mongorestore --host <host> --username <user> --password <pass> <backup-path>
```

## Monitoring & Health Checks

### Health Check Endpoints
- `GET /api/v1/health` - Backend health check
- `GET /health` - Nginx health check
- `GET /api/v1/sets/active` - Verify set data loading

### Key Metrics to Monitor
- Response times (target: < 500ms)
- Error rates (target: < 1%)
- Database connection pool
- Memory usage
- API rate limits

## Known Issues & Limitations

### Beta Version Limitations
1. **Limited Set Content**: Only Lore & Legends (Set 16) data available initially
2. **No User Authentication**: Beta version is read-only
3. **Performance**: May be slower during peak load without caching optimization
4. **Mobile Experience**: While responsive, not fully optimized for mobile workflows

### Planned Improvements Post-Beta
1. User authentication and composition saving
2. Advanced search functionality
3. Composition sharing and rating
4. Live match data integration
5. Mobile app development

## Support & Maintenance

### Monitoring
- Set up monitoring for API response times
- Monitor error logs
- Track user engagement metrics
- Performance metrics

### Maintenance Schedule
- Daily: Check logs and metrics
- Weekly: Database backup verification
- Monthly: Security scanning
- As needed: Performance reviews

## Release Notes - Beta Version

### New Features
- Interactive TFT team builder with drag-and-drop
- Support for Lore & Legends (Set 16) champions and traits
- Set management system for easy updates
- Modern, responsive UI/UX
- Comprehensive documentation

### Bug Fixes
- Fixed champion placement logic
- Improved trait calculation accuracy
- Resolved set filtering issues
- Enhanced performance for large boards

### API Updates
- New `/sets` endpoints for managing TFT sets
- Enhanced filtering options for champions and traits
- Improved error handling and validation

## Timeline Target: December 3rd, 2025
- **Target Release**: December 3, 2025 (Lore & Legends launch day)
- **Beta Testing**: November 25 - December 2, 2025
- **Deployment**: December 2, 2025 (one day before launch)
- **Post-Launch**: December 3+ for updates and improvements