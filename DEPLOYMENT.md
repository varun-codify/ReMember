# ReMember Deployment Guide

## Prerequisites

Before deploying, you need:

1. **MongoDB Atlas Account** (Free tier available)
   - Sign up at https://www.mongodb.com/cloud/atlas/register
   - Create a cluster and get the connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/remember?retryWrites=true&w=majority`

2. **Vercel Account**
   - Sign up at https://vercel.com/signup
   - Can use your GitHub account

## Step 1: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free M0 tier)
3. Create a database user:
   - Go to "Database Access"
   - Add New Database User
   - Set username and strong password
   - Grant "Read and Write" privileges
4. Configure Network Access:
   - Go to "Network Access"
   - Add IP Address
   - Select "Allow Access from Anywhere" (0.0.0.0/0) for Vercel
5. Get Connection String:
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `remember`

## Step 2: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 3: Deploy to Vercel

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy the project:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: `remember` (or your choice)
   - In which directory is your code located: `./`
   - Want to override settings: `N`

4. **Set Environment Variables:**
   
   After initial deployment, configure these environment variables in Vercel Dashboard:
   
   Go to: https://vercel.com/your-username/remember/settings/environment-variables
   
   Add the following variables:
   
   - `MONGODB_URI` = Your MongoDB Atlas connection string
   - `JWT_SECRET` = Generate a secure random string (e.g., use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `ENCRYPTION_KEY` = Generate another secure random string
   - `NODE_ENV` = `production`
   - `YOUTUBE_API_KEY` = Your YouTube API key (optional, leave empty if you don't have one)

5. **Redeploy after setting env variables:**
   ```bash
   vercel --prod
   ```

## Step 4: Test Your Deployment

1. Open the provided Vercel URL
2. Test user registration
3. Test login
4. Test creating passwords/tasks/videos/websites
5. Test all CRUD operations

## Environment Variables Summary

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/remember` |
| `JWT_SECRET` | Secret key for JWT tokens | Random 64-character hex string |
| `ENCRYPTION_KEY` | Key for encrypting passwords | Random 64-character hex string |
| `NODE_ENV` | Environment mode | `production` |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key (optional) | Your API key or leave empty |

## Generating Secure Keys

Run these commands to generate secure keys:

```bash
# For JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# For ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check connection string format
- Ensure database user has correct permissions

### API Endpoints Not Working
- Check Vercel function logs in the dashboard
- Verify all environment variables are set
- Check for any build errors

### Build Failures
- Ensure all dependencies are listed in package.json files
- Check for any console errors in Vercel build logs

## Useful Commands

```bash
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]

# Remove deployment
vercel remove [deployment-name]
```

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Support

For issues:
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- GitHub Issues: Create an issue in your repository
