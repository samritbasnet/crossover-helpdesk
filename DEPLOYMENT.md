# 🚀 Deployment Guide - Crossover Helpdesk

## Quick Deploy (5 minutes)

### 🎯 Option 1: Netlify + Render (Recommended - 100% FREE)

#### **Step 1: Deploy Backend to Render**

1. **Go to [Render.com](https://render.com)**
2. **Sign up/Login** with GitHub
3. **Click "New +" → "Web Service"**
4. **Connect your repository**: `crossover-helpdesk`
5. **Configure deployment**:
   - **Name**: `crossover-helpdesk-api`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
6. **Set Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret-key-change-this
   DB_PATH=./helpdesk.db
   ```
7. **Deploy** - Render will give you a URL like: `https://crossover-helpdesk-api.onrender.com`

> **Note**: Free tier sleeps after 15 minutes of inactivity, but wakes up automatically on requests.

#### **Step 2: Deploy Frontend to Netlify**

1. **Go to [Netlify.com](https://netlify.com)**
2. **Sign up/Login** with GitHub
3. **Click "New site from Git"**
4. **Select your repository**: `crossover-helpdesk`
5. **Configure build settings**:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/build`
6. **Set Environment Variables**:
   ```
   REACT_APP_API_BASE=https://your-render-url.onrender.com/api
   REACT_APP_NAME=Crossover Helpdesk
   ```
7. **Deploy** - Netlify will give you a URL like: `https://crossover-helpdesk.netlify.app`

#### **Step 3: Update CORS Settings**

1. **Go back to Render dashboard**
2. **Add environment variable**:
   ```
   CORS_ORIGINS=https://your-netlify-url.netlify.app
   ```
3. **Redeploy** the backend

---

### 🎯 Option 2: Netlify + Cyclic (100% FREE Alternative)

#### **Deploy Backend to Cyclic**

1. **Go to [Cyclic.sh](https://cyclic.sh)**
2. **Sign up/Login** with GitHub
3. **Click "Link Your Own"**
4. **Select your repository**: `crossover-helpdesk`
5. **Configure**:
   - **App Name**: `crossover-helpdesk-api`
   - **Branch**: `main`
   - **Root Directory**: `server`
6. **Set Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret-key
   DB_PATH=./helpdesk.db
   ```
7. **Deploy** - Get URL like: `https://crossover-helpdesk-api.cyclic.app`

> **Benefits**: Never sleeps, built-in database, zero configuration!

---

### 🎯 Option 3: Fly.io (High Performance)

#### **Deploy Full Stack to Render**

1. **Go to [Render.com](https://render.com)**
2. **Sign up/Login** with GitHub
3. **Create Web Service**:
   - **Repository**: `crossover-helpdesk`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret-key
   DB_PATH=./helpdesk.db
   ```
5. **Deploy Backend** - Get URL like: `https://crossover-helpdesk.onrender.com`

6. **Create Static Site** for frontend:
   - **Repository**: `crossover-helpdesk`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`
7. **Set Environment Variables**:
   ```
   REACT_APP_API_BASE=https://your-render-backend.onrender.com/api
   ```

---

### 🎯 Option 3: Vercel (Full Stack)

#### **Deploy to Vercel**

1. **Go to [Vercel.com](https://vercel.com)**
2. **Import your GitHub repository**
3. **Configure for monorepo**:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. **Set Environment Variables**:
   ```
   REACT_APP_API_BASE=https://your-project.vercel.app/api
   ```
5. **Deploy**

For the backend API routes, create `api/` folder in root with serverless functions.

---

## 🔧 Production Checklist

### **Before Deployment:**

- [ ] Update `REACT_APP_API_BASE` in client `.env`
- [ ] Set strong `JWT_SECRET` in server environment
- [ ] Configure CORS origins for your domain
- [ ] Test locally with production build: `npm run build`

### **After Deployment:**

- [ ] Test user registration and login
- [ ] Create a test ticket
- [ ] Verify knowledge base works
- [ ] Check all API endpoints
- [ ] Test on mobile devices

### **Security:**

- [ ] Use HTTPS only (automatic with Netlify/Railway)
- [ ] Set strong JWT secret (32+ characters)
- [ ] Configure proper CORS origins
- [ ] Enable security headers (included in netlify.toml)

---

## 🌐 Custom Domain (Optional)

### **Netlify Custom Domain:**
1. Go to **Site Settings** → **Domain Management**
2. **Add custom domain**: `yourdomain.com`
3. **Configure DNS** with your domain provider
4. **Enable HTTPS** (automatic)

### **Railway Custom Domain:**
1. Go to **Settings** → **Domains**
2. **Add custom domain**: `api.yourdomain.com`
3. **Configure DNS** with CNAME record
4. **Enable HTTPS** (automatic)

---

## 📊 Monitoring & Logs

### **Railway:**
- **Logs**: Dashboard → Deployments → View Logs
- **Metrics**: CPU, Memory, Network usage
- **Database**: Built-in SQLite persistence

### **Netlify:**
- **Logs**: Site Dashboard → Functions → View Logs
- **Analytics**: Built-in traffic analytics
- **Forms**: Contact form handling (if needed)

---

## 💰 Pricing

### **Free Tier Limits:**

**Railway:**
- ✅ 500 hours/month execution time
- ✅ 1GB RAM, 1 vCPU
- ✅ 1GB persistent storage
- ✅ Custom domains

**Netlify:**
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Unlimited sites
- ✅ Custom domains

**Perfect for portfolio/demo projects!**

---

## 🚨 Troubleshooting

### **Common Issues:**

1. **CORS Error**: Update `CORS_ORIGINS` environment variable
2. **Build Failed**: Check Node.js version (use 18+)
3. **Database Error**: Ensure `DB_PATH` is set correctly
4. **API Not Found**: Verify `REACT_APP_API_BASE` URL

### **Debug Commands:**
```bash
# Test production build locally
cd client && npm run build && npx serve -s build

# Test server in production mode
cd server && NODE_ENV=production npm start
```

---

## 🎉 Success!

Your Crossover Helpdesk is now live! 🚀

**Share your live URLs:**
- **Frontend**: `https://your-site.netlify.app`
- **Backend API**: `https://your-api.railway.app`

**Perfect for:**
- Portfolio showcase
- Technical interviews
- Team demonstrations
- Production use

---

## 📞 Support

If you encounter any issues:
1. Check the deployment logs
2. Verify environment variables
3. Test API endpoints directly
4. Check CORS configuration

**Your professional helpdesk system is ready for the world!** 🌍
