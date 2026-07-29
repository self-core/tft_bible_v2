# TFT Bible v2 - Deployment Guide & Production Checklist

## Overview
This document provides comprehensive guidance for deploying the TFT Bible v2 application using either Vercel or Railway. The application follows a simplified architecture with a single Node.js backend using GraphQL and an optional React frontend.

## Architecture Summary
- **Backend**: Node.js with Apollo Server + GraphQL
- **Frontend**: React (optional, can be hosted separately)
- **Database**: In-memory data (for MVP) or MongoDB (for production)
- **Deployment**: Vercel Serverless Functions or Railway Docker containers

## Deployment Options

### Option 1: Vercel Deployment

#### Prerequisites
- Vercel CLI installed (`npm install -g vercel`)
- Vercel account with project created
- Git repository connected to Vercel (recommended)

#### Steps
1. **Prepare the project**:
   ```bash
   # Ensure all dependencies are installed
   cd backend-simple
   npm install
   npm run build
   cd ..
   ```

2. **Configure Vercel project**:
   ```bash
   vercel
   ```
   - Link to your existing project or create new
   - Set framework to "Next.js" if prompted
   - Set build command to `cd backend-simple && npm run build`
   - Set output directory to `backend-simple/dist`

3. **Set environment variables** (if using database):
   - `MONGODB_URI`: MongoDB connection string
   - `NODE_ENV`: production

4. **Deploy**:
   ```bash
   vercel --prod
   ```

#### Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "name": "tft-bible-backend",
  "rewrites": [
    {
      "source": "/graphql",
      "destination": "/api/graphql"
    },
    {
      "source": "/health",
      "destination": "/api/health"
    }
  ]
}
```

### Option 2: Railway Deployment

#### Prerequisites
- Railway account
- Docker installed and running

#### Steps
1. **Connect Railway to your Git repository** (GitHub/GitLab)

2. **Configure the project in Railway**:
   - Service type: Container
   - Dockerfile path: `backend-simple/Dockerfile`
   - Build context: `.`
   - Port: `4000`

3. **Set environment variables**:
   - `PORT`: `4000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: (if using database)

4. **Deploy**:
   - Railway will automatically build and deploy on Git push

#### Railway Configuration (`railway.config.yml`)
```yaml
# Railway Configuration for TFT Bible
service:
  name: "tft-bible-app"
  type: "container"

build:
  context: "."
  dockerfilePath: "backend-simple/Dockerfile"

variables:
  - name: "PORT"
    value: "4000"
  - name: "NODE_ENV"
    value: "production"

healthcheck:
  protocol: "HTTP"
  port: 4000
  path: "/health"
  interval: 30
  timeout: 10
  threshold: 2

expose:
  - port: 4000
    name: "api"
    public: true
```

### Option 3: Docker Compose Deployment (Self-hosted)

#### Steps
1. **Build and run with Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```

2. **Services will be available at**:
   - Backend API: http://localhost:4000
   - Frontend: http://localhost (proxied to backend)

## Production Checklist

### Before Deployment

- [ ] **Code Quality**
  - [ ] All tests pass (`npm test`)
  - [ ] Linting passes (`npm run lint`)
  - [ ] Type checking passes (`npm run type-check`)
  - [ ] No console.log statements in production code

- [ ] **Security**
  - [ ] Environment variables are properly configured
  - [ ] No sensitive data in source code
  - [ ] Dependencies are up-to-date
  - [ ] Security audit passed (`npm audit`)

- [ ] **Performance**
  - [ ] Database indexes are optimized (if applicable)
  - [ ] GraphQL queries are efficient
  - [ ] Asset bundling is optimized
  - [ ] Caching is configured

### During Deployment

- [ ] **Infrastructure**
  - [ ] SSL/TLS certificates are configured
  - [ ] Domain/DNS is properly configured
  - [ ] Load balancing is set up (if needed)
  - [ ] Monitoring is configured

- [ ] **Database** (if using persistent storage)
  - [ ] Database connection is established
  - [ ] Initial data seeding is complete
  - [ ] Backup jobs are configured

### After Deployment

- [ ] **Health Checks**
  - [ ] Health endpoint returns 200: `GET /health`
  - [ ] GraphQL endpoint is accessible: `POST /graphql`
  - [ ] All API endpoints return expected responses

- [ ] **Functionality Tests**
  - [ ] Champions data is accessible via GraphQL
  - [ ] Traits data is accessible via GraphQL
  - [ ] Items data is accessible via GraphQL
  - [ ] Compositions data is accessible via GraphQL
  - [ ] Search functionality works

- [ ] **Monitoring**
  - [ ] Error tracking is active
  - [ ] Performance monitoring is active
  - [ ] Uptime monitoring is active
  - [ ] Log aggregation is configured

## API Endpoints

### GraphQL Endpoint
- **URL**: `/graphql`
- **Method**: POST
- **Description**: Main GraphQL API for all TFT data

### Health Check
- **URL**: `/health`
- **Method**: GET
- **Response**: `{"status": "OK", "service": "TFT Bible Backend"}`

## Available GraphQL Queries

### Champions
```graphql
{
  champions {
    id
    name
    cost
    traits
  }
}
```

### Specific Champion
```graphql
{
  champion(id: "TFT16_Ahri") {
    id
    name
    cost
    traits
    ability {
      name
    }
  }
}
```

### Traits
```graphql
{
  traits {
    key
    name
    description
  }
}
```

### Search
```graphql
{
  search(searchTerm: "Ahri") {
    champions {
      id
      name
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Health Check Failing**
   - Check that the server is running on the correct port
   - Verify environment variables are set correctly

2. **GraphQL Endpoint Not Responding**
   - Check server logs for errors
   - Verify schema is properly defined
   - Confirm resolvers are returning correct data

3. **Database Connection Issues** (if applicable)
   - Verify `MONGODB_URI` environment variable
   - Check network connectivity to database
   - Ensure database credentials are correct

4. **Docker Build Failures**
   - Ensure Docker is running
   - Check for any missing dependencies in Dockerfile
   - Verify Dockerfile paths are correct

## Rollback Plan

If production issues occur:

1. **Immediate Actions**:
   - Deploy the previous stable version
   - Check application logs for error patterns
   - Monitor system metrics

2. **Rollback Process**:
   - Vercel: Use `vercel alias` to rollback to previous deployment
   - Railway: Use the previous deployment in the UI
   - Docker: Revert to the previous image tag

## Scaling Considerations

1. **Load Patterns**:
   - Monitor request volume and response times
   - Plan for peak usage (patch releases, tournaments)

2. **Database** (if applicable):
   - Consider read replicas for high-traffic scenarios
   - Optimize queries and add appropriate indexes

3. **Caching**:
   - Implement API response caching
   - Consider CDN for static assets

4. **Monitoring**:
   - Set up alerts for performance degradation
   - Monitor error rates and user experience metrics