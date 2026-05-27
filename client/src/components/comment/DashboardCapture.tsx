import React, { useState } from 'react';
import html2canvas from 'html2canvas';

const DashboardCapture: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [comment, setComment] = useState('');

  const handleCaptureAndUpload = async () => {
    setIsProcessing(true);
    try {
      // Capture the whole page
      const canvas = await html2canvas(document.documentElement, { useCORS: true });
      const imageBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!imageBlob) throw new Error('Failed to create image blob');

      const fileName = `dashboard_${Date.now()}.png`;

      // Save to Cache Storage (local cache) so it's available later
      const saveToCache = async (blob: Blob, name: string) => {
        try {
          if ('caches' in window) {
            const cache = await caches.open('sac-screenshots');
            const key = `/screenshot/${name}`;
            const resp = new Response(blob, { headers: { 'Content-Type': 'image/png' } });
            await cache.put(key, resp.clone());
            const list = JSON.parse(localStorage.getItem('sac_screenshots') || '[]');
            list.unshift({ key, fileName: name, ts: Date.now() });
            localStorage.setItem('sac_screenshots', JSON.stringify(list.slice(0, 20)));
            localStorage.setItem('sac_last_screenshot', key);
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Failed to save screenshot to cache', e);
        }
      };

      const openBlobInNewTab = (blob: Blob) => {
        try {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 15000);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Failed to open image in new tab', e);
        }
      };

      // persist locally and open immediately
      saveToCache(imageBlob, fileName).catch(() => {});
      openBlobInNewTab(imageBlob);

      // Send screenshot to API for processing and storage
      const formData = new FormData();
      formData.append('file', imageBlob, fileName);
      
      const commentResponse = await fetch('/api/generate-comments', {
        method: 'POST',
        body: formData
      });
      const data = await commentResponse.json();
      setComment(data.comment || '');

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error capturing dashboard:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePuppeteerCapture = async () => {
    const sacUrl = 'https://vodafone-company-q.eu10.hcs.cloud.sap/sap/fpa/ui/tenants/ff773/app.html#/story2&/s2/DBB01807319193F64AE20D65C426E12C/?url_api=true&preview=true&mode=edit&view_id=story2';
    
    try {
      // Trigger the backend Puppeteer process (non-blocking)
      fetch('/api/puppeteer-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sacUrl }),
        referrerPolicy: 'no-referrer'
      }).catch(err => console.error('API trigger error:', err));

      // Redirect to the SAC URL with no-referrer policy using a transient link
      const link = document.createElement('a');
      link.href = sacUrl;
      link.rel = 'noreferrer';
      // Uncomment the line below if you want it to open in a new tab
      // link.target = '_blank'; 
      link.click();

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error initiating Puppeteer capture:', error);
    }
  };

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button className="cp-btn-ghost" onClick={handleCaptureAndUpload} disabled={isProcessing} id="btn-generate-comments">
        {isProcessing ? 'Analyzing...' : 'Generate Comments'}
      </button>
      <button className="cp-btn-ghost" onClick={handlePuppeteerCapture} disabled={isProcessing} id="btn-puppeteer-capture">
        {isProcessing ? 'Running Puppeteer...' : 'Capture SAC Story (Puppeteer)'}
      </button>

      {comment && (
        <div style={{ marginTop: 12, padding: 10, background: '#e7f3ff' }}>
          <h4 style={{ margin: '0 0 6px 0' }}>AI Insights:</h4>
          <p style={{ margin: 0 }}>{comment}</p>
        </div>
      )}
    </div>
  );
};

export default DashboardCapture;
