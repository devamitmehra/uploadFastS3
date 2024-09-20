import React, { createContext, useEffect, useRef, useContext, useState } from 'react';
import Uppy from '@uppy/core';
import AwsS3Multipart from '@uppy/aws-s3-multipart';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

const UppyContext = createContext(null);

export const UppyProvider = ({ children }) => {
  const [uppy, setUppy] = useState(null);
  const presignedUrlsRef = useRef({});

  useEffect(() => {
    const uppyInstance = new Uppy({
      maxFileSize: null,  // Allow any file size
      autoProceed: false, // Do not auto-start the upload
      debug: true,        // Enable debug logs
    });

    const fetchPresignedUrls = async (files) => {
      const fileData = files.map((file) => ({
        fileName: file.name,
        fileType: file.type,
      }));

      try {
        const response = await fetch('http://localhost:3001/generate-presigned-urls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: fileData }),
        });

        const data = await response.json();
        const urlsMap = {};

        data.urls.forEach((urlData, index) => {
          urlsMap[fileData[index].fileName] = urlData.url;
        });

        presignedUrlsRef.current = urlsMap;
        return urlsMap;
      } catch (error) {
        console.error('Error fetching presigned URLs:', error);
      }
    };

    let presignedUrlsFetched = false;
    uppyInstance.on('files-added', async (files) => {
      if (!presignedUrlsFetched) {
        await fetchPresignedUrls(files);
        presignedUrlsFetched = true;
      }
    });

    uppyInstance.use(AwsS3Multipart, {
      endpoint: '/', // Modify based on your backend
      async getUploadParameters(file) {
        const presignedUrls = presignedUrlsRef.current;

        if (!presignedUrls[file.name]) {
          throw new Error('Presigned URL not found for file: ' + file.name);
        }

        return {
          method: 'PUT',
          url: presignedUrls[file.name],
          headers: {
            'Content-Type': file.type,
          },
        };
      },
      limit: 20,
      partSize: 50 * 1024 * 1024, // Each part is 50 MB
    });

    // Set Uppy instance
    setUppy(uppyInstance);

    // Monitor upload progress
    uppyInstance.on('upload-progress', (file, progress) => {
      console.log(`${file.name}: ${progress.bytesUploaded} of ${file.size} uploaded.`);
    });

    // Handle complete event
    uppyInstance.on('complete', (result) => {
      console.log('Upload complete! These files were uploaded:', result.successful);
    });

    // Handle upload errors
    uppyInstance.on('upload-error', (file, error) => {
      console.error(`Error uploading ${file.name}:`, error);
    });

    // Add beforeunload event listener
    const handleBeforeUnload = (e) => {
      const uploadsInProgress = uppyInstance.getFiles().some(file => file.progress.uploadStarted && !file.progress.uploadComplete);
      if (uploadsInProgress) {
        const message = 'You have ongoing uploads. Are you sure you want to leave?';
        e.returnValue = message; // For Chrome
        return message; // Display the warning to the user
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      uppyInstance.cancelAll(); // Cancel all uploads when unmounted
      window.removeEventListener('beforeunload', handleBeforeUnload); // Remove the event listener
    };
  }, []);

  return (
    <UppyContext.Provider value={uppy}>
      {children}
    </UppyContext.Provider>
  );
};

export const useUppy = () => useContext(UppyContext);
