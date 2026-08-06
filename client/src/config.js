// In production the API is served from the same origin (/api), so a relative
// path works for both the Express server (Render) and the Vercel deployment.
// Override with REACT_APP_API_URL if the API is hosted separately.
const API_URL = process.env.REACT_APP_API_URL || '/api';

export default API_URL;
