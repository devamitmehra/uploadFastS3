import React, { useEffect, useState, useRef } from 'react';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import AwsS3Multipart from '@uppy/aws-s3-multipart';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

const UploadComponentCamp = () => {
  const [uppy, setUppy] = useState(null);
  const presignedUrlsRef = useRef({}); // Use a ref to hold presigned URLs

  useEffect(() => {
    const uppyInstance = new Uppy({
      maxFileSize: null,  // Allow any file size
      autoProceed: false, // Do not auto-start the upload
      debug: true,        // Enable debug logs
    });

    // Function to fetch all presigned URLs at once
    const fetchPresignedUrls = async (files) => {
      const fileData = files.map((file) => ({
        fileName: file.name,
        fileType: file.type,
      }));

      console.log('Fetching presigned URLs for files:', fileData);

      try {
        const response = await fetch('http://localhost:3001/generate-presigned-urls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: fileData }), // Send all file details at once
        });

        const data = await response.json();
        const urlsMap = {};

        // Map presigned URLs to file names
        data.urls.forEach((urlData, index) => {
          urlsMap[fileData[index].fileName] = urlData.url;
        });

        presignedUrlsRef.current = urlsMap; // Store presigned URLs in ref
        console.log('Presigned URLs fetched:', urlsMap);

        return urlsMap;
      } catch (error) {
        console.error('Error fetching presigned URLs:', error);
      }
    };

    // Only fetch presigned URLs once when files are added
    let presignedUrlsFetched = false;
    uppyInstance.on('files-added', async (files) => {
      // Ensure that presigned URLs are fetched only once
      if (!presignedUrlsFetched) {
        console.log('Files added:', files);
        await fetchPresignedUrls(files);
        presignedUrlsFetched = true; // Mark URLs as fetched
      }
    });

    // Use AwsS3Multipart plugin with getUploadParameters
    uppyInstance.use(AwsS3Multipart, {
      endpoint: '/', // Update endpoint if necessary
      async getUploadParameters(file) {
        const presignedUrls = presignedUrlsRef.current;

        // Check if the presigned URL for the file is already fetched
        if (!presignedUrls[file.name]) {
          throw new Error('Presigned URL not found for file: ' + file.name);
        }

        console.log('Uploading file:', file.name, 'using URL:', presignedUrls[file.name]);

        // Return presigned URL for the current file from cached URLs
        return {
          method: 'PUT', // Upload method
          url: presignedUrls[file.name], // Use presigned URL for the file
          headers: {
            'Content-Type': file.type, // Set Content-Type for each file
          },
        };
      },
      limit: 20, // Upload 5 parts concurrently
      partSize: 50 * 1024 * 1024, // Each part is 50 MB
    });

    setUppy(uppyInstance);

    // Handle progress and completion events
    uppyInstance.on('upload-progress', (file, progress) => {
      console.log(`${file.name}: ${progress.bytesUploaded} of ${file.size} uploaded.`);
    });

    uppyInstance.on('complete', (result) => {
      console.log('Upload complete! These files were uploaded:', result.successful);
    });

    uppyInstance.on('upload-error', (file, error) => {
      console.error(`Error uploading ${file.name}:`, error);
    });

    return () => {
      uppyInstance.close();
    };
  }, []);

  if (!uppy) {
    return <div>Loading Uppy...</div>;
  }

  return (
    <div>
      <h1>Upload Large Files with Uppy and S3 Multipart</h1>
      <Dashboard
        uppy={uppy}
        proudlyDisplayPoweredByUppy={false}
        showProgressDetails={true}
      />
    </div>
  );
};

export default UploadComponentCamp;
