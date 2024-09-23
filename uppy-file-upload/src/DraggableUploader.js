import React, { useState, useEffect } from 'react';
import { Dashboard } from '@uppy/react';
import { createUppyInstance } from './UppyProvider';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import { useLocation } from 'react-router-dom'; 
const DraggableUploader = ({ instanceKey, isOnHome, handleUploadProgress }) => {
  const [uppy, setUppy] = useState(null);
  const [isExpanded, setIsExpanded] = useState(isOnHome); 
  const [isUploading, setIsUploading] = useState(false); 
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0); 
  const location = useLocation(); 

  useEffect(() => {
    const uppyInstance = createUppyInstance(); 
    setUppy(uppyInstance);

    const checkUploads = () => {
      const files = uppyInstance.getFiles();
      const hasActiveUploads = files.some(file => file.progress.uploadStarted && !file.progress.uploadComplete);
      setIsUploading(hasActiveUploads);
      handleUploadProgress(hasActiveUploads); 

      const completedFilesCount = files.filter(file => file.progress.uploadComplete).length;
      setUploadedFilesCount(completedFilesCount); // Update file count for completed uploads
    };

    uppyInstance.on('upload-progress', checkUploads);
    uppyInstance.on('complete', checkUploads);

    return () => {
      uppyInstance.cancelAll();
    };
  }, []);

  // Detect location change and adjust the state accordingly
  useEffect(() => {
    if (location.pathname === '/') {
      setIsExpanded(true); 
    } else {
      setIsExpanded(false); 
    }
  }, [location, isUploading]); 

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isUploading) {
        const message = 'You have an ongoing upload. Are you sure you want to leave?';
        event.preventDefault(); // Some browsers require preventDefault
        event.returnValue = message; // Required for modern browsers
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isUploading]);

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded); // Manually toggle expanded state
  };

  if (!uppy) return null;

  // Conditionally show the uploader content (collapsed or expanded)
  const showUploader = isExpanded || isUploading;

  const UploaderContent = (
    <div
      style={{
        background: 'white',
        border: '1px solid #ddd',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
        padding: isExpanded ? '8px' : '2px',
        borderRadius: '8px',
        width: isExpanded ? '500px' : '250px', 
        height: isExpanded ? 'auto' : '100px',
        marginBottom: '10px',
        zIndex: 1000,
        overflow: 'hidden', 
        transition: 'all 0.3s ease', 
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '10px' : '2px' }}>
        <span style={{ fontWeight: 'bold', fontSize: isExpanded ? '14px' : '10px' }}>Uploader {instanceKey}</span>
        <span style={{ fontWeight: 'bold', fontSize: isExpanded ? '14px' : '10px' }}>
          {uploadedFilesCount} {uploadedFilesCount === 1 ? 'file' : 'files'} uploaded
        </span>
        {!isOnHome && (
          <>
            <button
              onClick={() => setIsExpanded(false)} // Hide button
              style={{
                padding: '5px 8px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
              }}
            >
              Hide
            </button>
            <button
              onClick={handleExpandToggle}
              style={{
                padding: '5px 8px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                marginLeft: '5px',
              }}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </>
        )}
      </div>

      <div
        style={{
          display: isExpanded ? 'block' : 'none', 
        }}
      >
        <Dashboard
          uppy={uppy}
          proudlyDisplayPoweredByUppy={false}
          showProgressDetails={true}
          height={showUploader ? 'auto' : 0} 
        />
      </div>
    </div>
  );

  return <div>{UploaderContent}</div>;
};

export default DraggableUploader;
