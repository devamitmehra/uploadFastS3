
import React, { useState, useEffect } from 'react';
import { Dashboard } from '@uppy/react';
import Draggable from 'react-draggable';
import { useLocation } from 'react-router-dom';
import { useUppy } from './UppyProvider';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

const DraggableUploader = () => {
  const uppy = useUppy();
  const location = useLocation();
  const [isDocked, setIsDocked] = useState(false); 
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false); 
  const [isUploading, setIsUploading] = useState(false); 
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const isOnUploadPage = location.pathname === '/';

  useEffect(() => {
    if (!uppy) {
      console.log('Uppy is not initialized');
      return;
    }

    // Check if there are active uploads
    const checkUploads = () => {
      const files = uppy.getFiles();
      const hasActiveUploads = files.some(file => !file.progress.uploadComplete);
      setIsUploading(hasActiveUploads);

      // Always show uploader on Home page
      if (isOnUploadPage || hasActiveUploads) {
        setIsVisible(true);
        setIsDocked(!isOnUploadPage); 
      } else {
        setIsVisible(false); 
      }
    };

    // Listen to Uppy events
    uppy.on('upload', checkUploads);
    uppy.on('complete', checkUploads);
    uppy.on('file-added', checkUploads);
    uppy.on('upload-progress', checkUploads);

    // Run an initial check
    checkUploads();

    return () => {
      uppy.off('upload', checkUploads);
      uppy.off('complete', checkUploads);
      uppy.off('file-added', checkUploads);
      uppy.off('upload-progress', checkUploads);
    };
  }, [uppy, isOnUploadPage]);

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded); 
  };

  const handleDragStop = (e, data) => {
    setPosition({ x: data.x, y: data.y });
  };

  if (!uppy) {
    console.log('Uppy instance not initialized');
    return null;
  }

  if (!isVisible) {
    console.log('Uploader is hidden');
    return null;
  }

  // Render inside the specific div on the Home page
  if (isOnUploadPage) {
    return (
      <div style={{ marginTop: '20px' }}>
        <Dashboard
          uppy={uppy}
          proudlyDisplayPoweredByUppy={false}
          showProgressDetails={true}
          height={400}
        />
      </div>
    );
  }

  // Render draggable uploader for other pages
  return (
    <Draggable
      position={position}
      onStop={handleDragStop}
    >
      <div
        style={{
          position: 'fixed',
          bottom: isDocked ? '10px' : '20px',
          right: isDocked ? '10px' : '20px',
          zIndex: 1000,
          background: 'white',
          border: '1px solid #ddd',
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
          padding: isDocked ? '8px' : '15px',
          borderRadius: '8px',
          width: isDocked && !isExpanded ? '350px' : '500px',
          height: isDocked && !isExpanded ? 'auto' : 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontWeight: 'bold' }}>Uploader</span>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              padding: '5px 10px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Hide
          </button>
          {isDocked && (
            <button
              onClick={handleExpandToggle}
              style={{
                padding: '5px 10px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          )}
        </div>

        <Dashboard
          uppy={uppy}
          proudlyDisplayPoweredByUppy={false}
          showProgressDetails={true}
          height={isDocked && !isExpanded ? 100 : 400}
        />
      </div>
    </Draggable>
  );
};

export default DraggableUploader;
