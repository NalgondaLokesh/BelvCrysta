# 🚀 Render Deployment Guide for BelvCrysta Backend

## 📋 Prerequisites
- Render account (free tier available)
- GitHub repository with backend code
- MongoDB Atlas database

## 🔧 Step-by-Step Deployment

### 1️⃣ Prepare Your Code
✅ Already completed:
- Created `requirements.txt` with all dependencies
- Created `Procfile` for Render
- Created `render.yaml` configuration
- Updated `app.py` for production

### 2️⃣ Push to GitHub
Make sure your backend code is pushed to GitHub:
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 3️⃣ Deploy on Render

#### Option A: Using Render Dashboard (Recommended)
1. Go to [render.com](https://render.com)
2. Sign up/login with your GitHub account
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Select the `BelvCrysta` repository
6. Configure the service:
   - **Name**: `belvcrysta-api`
   - **Environment**: `Python 3`
   - **Root Directory**: `backend` (if backend is in subfolder)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Instance Type**: `Free`

#### Option B: Using render.yaml
1. Push the `render.yaml` file to your repository
2. In Render dashboard, click "New +" → "Web Service"
3. Connect your repository
4. Render will automatically detect the `render.yaml` configuration

### 4️⃣ Set Environment Variables
In your Render service settings, add these environment variables:

#### Required Variables:
```
MONGO_URI=mongodb+srv://nalgondalokesh_db_user:lokesh0910@materialscience.qsw0z2r.mongodb.net/?appName=materialscience
SECRET_KEY=crystal_secret
FLASK_ENV=production
FLASK_DEBUG=False
```

#### Optional Variables:
```
PYTHON_VERSION=3.9.16
```

### 5️⃣ Deploy and Test
1. Click "Create Web Service"
2. Wait for deployment to complete (2-5 minutes)
3. Your API will be available at: `https://belvcrysta-api.onrender.com`

### 6️⃣ Test the Deployment
Test your deployed API:
```bash
# Test root endpoint
curl https://belvcrysta-api.onrender.com/

# Test elements endpoint
curl https://belvcrysta-api.onrender.com/api/elements
```

## 🔍 Troubleshooting

### Common Issues:

#### 1. Build Fails
- Check `requirements.txt` for correct versions
- Ensure all dependencies are compatible with Python 3.9

#### 2. Runtime Error
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check Render logs for specific errors

#### 3. Model Loading Issues
- Ensure model files are included in deployment
- Check file paths in `app.py`
- Model files might be too large for free tier

#### 4. Database Connection Issues
- Verify MongoDB Atlas IP whitelist (allow all IPs: 0.0.0.0/0)
- Check connection string format
- Ensure database user has correct permissions

### 📊 Monitoring
- View logs in Render dashboard
- Monitor resource usage
- Set up health checks

## 🔄 Continuous Deployment
Render automatically redeploys when you push to GitHub:
1. Make changes to your code
2. Commit and push to GitHub
3. Render will automatically rebuild and deploy

## 🌐 API Endpoints
Once deployed, your API will be available at:
- **Base URL**: `https://belvcrysta-api.onrender.com`
- **Health Check**: `/`
- **Generate**: `/api/generate`
- **Elements**: `/api/elements`
- **History**: `/api/history`
- **Auth**: `/api/auth/login`, `/api/auth/register`

## 📝 Next Steps
1. Update frontend API URLs to point to Render backend
2. Set up custom domain (optional)
3. Configure monitoring and alerts
4. Scale up if needed (paid plans)

## 💡 Tips
- Use the free tier for development and testing
- Monitor your usage to avoid hitting limits
- Keep an eye on MongoDB Atlas free tier limits
- Consider using environment-specific configurations

---

**🎉 Your BelvCrysta backend will be live on Render!**
