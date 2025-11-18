# Jenkins CI/CD Pipeline Configuration

## Overview
This document describes the Jenkins pipeline setup for the TFT Bible project.

## Prerequisites

1. Jenkins server installed with Docker plugin
2. Docker installed on Jenkins agents
3. Docker registry for storing images (optional for local testing)
4. Kubernetes cluster for production deployment (optional)

## Jenkins Setup

### 1. Install Required Plugins
- Docker Pipeline Plugin
- Docker Commons Plugin
- Blue Ocean (optional for UI)
- Kubernetes Plugin (for k8s deployments)

### 2. Configure Docker in Jenkins
- Ensure Jenkins has Docker access
- Configure Docker registry credentials if using private registry

### 3. Create Jenkins Job
Create a new Pipeline job with the following configuration:

- Pipeline script from SCM
- SCM: Git
- Repository: Your TFT Bible repository URL
- Script Path: Jenkinsfile

## Pipeline Stages

### 1. Checkout
- Pulls source code from repository
- Includes all necessary files for building

### 2. Build Backend
- Builds the Rust backend Docker image
- Uses multi-stage build for optimization

### 3. Build Frontend
- Builds the React frontend Docker image
- Optimizes for production deployment

### 4. Run Tests (Parallel)
- Backend tests using cargo test
- Frontend tests using npm test
- Runs in parallel to reduce build time

### 5. Security Scan
- Scans Docker images for vulnerabilities
- Provides security feedback

### 6. Build and Push Images
- Builds final images with latest tag
- Pushes to configured Docker registry
- Only runs on main branch

### 7. Deploy to Dev
- Deploys to development environment
- Uses docker-compose for local deployment
- Only runs on main branch

### 8. Deploy to Production
- Manual approval gate
- Updates production environment
- Only runs on main branch with approval

## Environment Variables

- `DOCKER_REGISTRY`: Docker registry for image storage
- `NAMESPACE`: Kubernetes namespace (if applicable)

## Credential Setup

You'll need to configure the following credentials in Jenkins:

- `docker-registry-credentials`: For Docker registry access

## Docker Registry Setup

For local development, you can run a local Docker registry:

```bash
docker run -d -p 5000:5000 --name registry registry:2
```

## Kubernetes Deployment (Optional)

If using Kubernetes, create the following files:

### backend-deployment.yml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tft-backend
  namespace: tft-bible
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tft-backend
  template:
    metadata:
      labels:
        app: tft-backend
    spec:
      containers:
      - name: backend
        image: localhost:5000/tft-bible-backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: MONGODB_URL
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: url
---
apiVersion: v1
kind: Service
metadata:
  name: tft-backend-service
  namespace: tft-bible
spec:
  selector:
    app: tft-backend
  ports:
    - protocol: TCP
    - port: 8080
      targetPort: 8080
  type: ClusterIP
```

### frontend-deployment.yml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tft-frontend
  namespace: tft-bible
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tft-frontend
  template:
    metadata:
      labels:
        app: tft-frontend
    spec:
      containers:
      - name: frontend
        image: localhost:5000/tft-bible-frontend:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: tft-frontend-service
  namespace: tft-bible
spec:
  selector:
    app: tft-frontend
  ports:
    - protocol: TCP
    - port: 80
      targetPort: 80
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tft-ingress
  namespace: tft-bible
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: tft-bible.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tft-frontend-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: tft-backend-service
            port:
              number: 8080
```