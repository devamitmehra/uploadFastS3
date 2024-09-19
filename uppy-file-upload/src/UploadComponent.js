import React, { useEffect } from 'react';
import Uppy from '@uppy/core';
import  Dashboard from '@uppy/dashboard';
//import AwsS3 from '@uppy/aws-s3'; // Latest version of @uppy/aws-s3
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

const UploadComponent = () => {
  useEffect(() => {
    const uppy = new Uppy({
      id: 'uppyInstance', // Ensure the Uppy instance itself has an ID
      restrictions: {
        maxNumberOfFiles: 5,          // Maximum number of files to upload
       // allowedFileTypes: ['image/*', 'video/*'],  // Restrict file types
      },
      autoProceed: false,              // Don't auto-upload files
    });

    // Use Dashboard plugin
    uppy.use(Dashboard, {
      id: 'Dashboard',                // Explicitly set a unique ID for Dashboard
      inline: true,
      target: '#uppy-progress',       // Set target for the Uppy Dashboard UI
      hidePoweredBy: true,            // Hide "Powered by Uppy" message
    });

    // Use AwsS3 plugin
    // uppy.use(AwsS3, {
    //   id: 'AwsS3',                    // Explicitly set a unique ID for AwsS3
    //   companionUrl: '/',              // Set companion URL (not used here)
    //   getUploadParameters: (file) => {
    //     // Fetch presigned URL from backend
    //     return new Promise((resolve, reject) => {
    //       fetch('http://localhost:3001/generate-presigned-url', {
    //         method: 'POST',
    //         headers: {
    //           'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //           fileName: file.name,     // Send file name to backend
    //           fileType: file.type,     // Send file type to backend
    //         }),
    //       })
    //         .then((response) => response.json())
    //         .then((data) => {
    //           resolve({
    //             method: 'PUT',         // Upload method
    //             url: data.url,         // Presigned URL returned by backend
    //             headers: {
    //               'Content-Type': file.type, // Send correct Content-Type
    //             },
    //           });
    //         })
    //         .catch(() => {
    //           reject('Error getting signed URL');
    //         });
    //     });
    //   },
    // });

    // Handle Uppy events
    uppy.on('complete', (result) => {
      console.log('Upload complete! These files were uploaded:', result.successful);
    });

    // Clean up Uppy instance on unmount
    return () => {
      uppy.close();
    };
  }, []);

  return (
    <div>
      <h1>File Upload</h1>
      <div id="uppy-progress"></div>  {/* Dashboard will be rendered here */}
    </div>
  );
};

export default UploadComponent;
