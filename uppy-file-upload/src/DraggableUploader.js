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

    // Monitor upload progress and state
    const checkUploads = () => {
      const files = uppyInstance.getFiles();
      const hasActiveUploads = files.some(file => file.progress.uploadStarted && !file.progress.uploadComplete);
      setIsUploading(hasActiveUploads);
      handleUploadProgress(hasActiveUploads); 

      // Count the number of completed uploads
      const completedFilesCount = files.filter(file => file.progress.uploadComplete).length;
      setUploadedFilesCount(completedFilesCount);
    };

    uppyInstance.on('upload-progress', checkUploads);
    uppyInstance.on('complete', checkUploads);

    return () => {
      uppyInstance.cancelAll();
    };
  }, []);

  // Add the prompt for closing the window when upload is in progress
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isUploading) {
        const message = 'You have uploads in progress. Are you sure you want to leave?';
        event.preventDefault();
        event.returnValue = message; // Some browsers require this line.
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload); // Clean up the event listener
    };
  }, [isUploading]);

  useEffect(() => {
    if (location.pathname === '/') {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [location, isUploading]);

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded); 
  };

  if (!uppy) return null;

  const showUploader = isExpanded || isUploading;

  const UploaderContent = (
    <div
      style={{
        background: '#fff',
        border: '1px solid #ddd',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', 
        padding: isExpanded ? '16px' : '10px', // Adjusted padding
        borderRadius: '12px',
        width: isExpanded ? '500px' : '250px',
        height: isExpanded ? 'auto' : '60px', 
        marginBottom: '16px',
        zIndex: 1000,
        overflow: 'hidden', 
        transition: 'all 0.3s ease', 
        fontFamily: 'Arial, sans-serif', 
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '16px' : '4px' }}>
        {/* Display dynamic instance number and uploaded file count */}
        <div style={{ fontWeight: 'bold', fontSize: isExpanded ? '16px' : '12px' }}>
          Uploader {instanceKey} - {uploadedFilesCount} {uploadedFilesCount === 1 ? 'file' : 'files'} uploaded
        </div>

        {/* Buttons for controlling collapse/expand */}
        {!isOnHome && (
          <div>
            <button
              onClick={handleExpandToggle}
              style={{
                padding: '6px 12px',
                background: '#4CAF50', // Subtle green color for expand
                border: '1px solid #3e8e41',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: isExpanded ? 'block' : 'none', // Show dashboard if expanded or uploading
        }}
      >
        <Dashboard
          uppy={uppy}
          proudlyDisplayPoweredByUppy={false}
          showProgressDetails={true}
          height={showUploader ? 'auto' : 0} // Fully collapsed when not uploading and not expanded
        />
      </div>
    </div>
  );

  return <div>{UploaderContent}</div>;
};

export default DraggableUploader;
