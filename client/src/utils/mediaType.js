// Client-side mirror of server/services/captureService.detectMediaType —
// used to show capture hints before the server classifies the link.

const detectMediaType = (url) => {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (u.hostname === 'github.com' && u.pathname.split('/').filter(Boolean).length >= 2) {
      return 'github';
    }
    const path = u.pathname.toLowerCase();
    if (path.endsWith('.pdf')) return 'pdf';
    if (/\.(png|jpe?g|gif|webp|svg|avif|bmp)$/.test(path)) return 'image';
    return 'webpage';
  } catch (e) {
    return 'webpage';
  }
};

export const MEDIA_TYPE_META = {
  webpage: { icon: '🌐', label: 'Website / tool' },
  pdf: { icon: '📄', label: 'PDF document' },
  image: { icon: '🖼', label: 'Image' },
  github: { icon: '🐙', label: 'GitHub repository' },
};

export default detectMediaType;
