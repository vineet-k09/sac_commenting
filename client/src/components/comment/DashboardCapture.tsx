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

  return (
    <div style={{ marginTop: 12 }}>
      <button className="cp-btn-ghost" onClick={handleCaptureAndUpload} disabled={isProcessing} id="btn-generate-comments">
        {isProcessing ? 'Analyzing...' : 'Generate Comments'}
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
