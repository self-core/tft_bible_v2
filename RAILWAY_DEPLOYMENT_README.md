# TFT Bible Railway Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the TFT Bible application to Railway using the free tier.

## Prerequisites
- Railway account (https://railway.app)
- MongoDB Atlas account (free tier)
- GitHub repository with your code

## Architecture
```
Railway Project
├── Backend Service (Rust/Axum)
│   ├── Dockerfile.railway
│   └── railway.toml
└── Frontend Service (React/TypeScript)
    ├── Dockerfile.railway
    └── nginx.railway.conf
```

## Deployment Steps

### 1. Set Up MongoDB Atlas (Free Tier)
1. Create account at https://www.mongodb.com/atlas
2. Create a free cluster (M0 - Free)
3. Create database user with read/write permissions
4. Add IP address `0.0.0.0/0` to network access (temporary for setup)
5. Get connection string from "Connect" > "Connect your application"

### 2. Create Railway Project
1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Connect your GitHub account and select the repository
4. Railway will automatically detect the `railway.toml` file

### 3. Configure Environment Variables
In Railway dashboard, go to your project settings and add:

#### Backend Service Variables:
```
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/tft_bible_prod?retryWrites=true&w=majority
DATABASE_NAME=tft_bible_prod
PORT=8080
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
CORS_ORIGIN=https://your-frontend-service.railway.app
```

#### Frontend Service Variables:
```
VITE_API_URL=https://your-backend-service.railway.app
```

### 4. Deploy Services
1. Railway will automatically build and deploy both services
2. Monitor deployment logs in Railway dashboard
3. Services will be available at:
   - Frontend: `https://your-project-name.railway.app`
   - Backend: `https://your-backend-service.railway.app`

### 5. Configure Custom Domain (Optional)
1. Go to project settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update CORS_ORIGIN environment variable with your domain

## Cost Optimization

### Free Tier Limits:
- 500 hours/month compute time
- 1GB storage
- Free SSL certificates
- Custom domains

### Monitoring Usage:
- Check Railway dashboard for usage statistics
- Monitor MongoDB Atlas usage
- Scale up if approaching limits

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check Railway build logs
   - Ensure Dockerfiles are correct
   - Verify environment variables are set

2. **Database Connection:**
   - Verify MongoDB Atlas connection string
   - Check network access settings
   - Ensure database user has correct permissions

3. **CORS Issues:**
   - Update CORS_ORIGIN with correct Railway domain
   - Check frontend VITE_API_URL setting

4. **Service Communication:**
   - Ensure backend service is running
   - Check Railway service URLs
   - Verify environment variables

### Health Checks:
- Frontend: Visit `/health` endpoint
- Backend: Visit `/health` endpoint
- Database: Check Railway logs for connection errors

## Maintenance

### Updating Deployment:
1. Push changes to GitHub main branch
2. Railway automatically redeploys
3. Monitor deployment in Railway dashboard

### Environment Variables:
- Never commit secrets to GitHub
- Use Railway dashboard for sensitive variables
- Rotate JWT_SECRET periodically

### Database Backups:
- MongoDB Atlas provides automatic backups on free tier
- Export data manually if needed
- Consider upgrading for better backup options

## Security Considerations

1. **Environment Variables:**
   - Store secrets in Railway dashboard
   - Use strong JWT secrets
   - Rotate credentials regularly

2. **Database Security:**
   - Restrict IP access after initial setup
   - Use strong database passwords
   - Enable MongoDB Atlas security features

3. **Application Security:**
   - Keep dependencies updated
   - Monitor for vulnerabilities
   - Use HTTPS (Railway provides free SSL)

## Support

- Railway Documentation: https://docs.railway.app/
- MongoDB Atlas Documentation: https://docs.mongodb.com/
- Community Support: Railway Discord or GitHub issues

## Cost Estimation

### Free Tier (Estimated):
- Railway: $0/month
- MongoDB Atlas: $0/month
- Domain: $0-15/month (optional)

### Paid Upgrades (if needed):
- Railway: $5-15/month for additional resources
- MongoDB Atlas: $9/month for dedicated cluster