import React, { useEffect, useState } from 'react';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import AwsS3Multipart from '@uppy/aws-s3-multipart';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

const UploadComponentCamp = () => {
  const [uppy, setUppy] = useState(null);

  useEffect(() => {
    const uppyInstance = new Uppy({
      maxFileSize: null,  // Allow any file size

      autoProceed: false, // Automatically start the upload
      debug: true, // Enable debug logs
    });

    uppyInstance.use(AwsS3Multipart, {
      companionUrl: '/',
      getUploadParameters: (file) => {
        // Fetch presigned URL from backend
        return new Promise((resolve, reject) => {
          fetch('http://localhost:3001/generate-presigned-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,     // Send file name to backend
              fileType: file.type,     // Send file type to backend
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              resolve({
                method: 'PUT',         // Upload method
                url: data.url,         // Presigned URL returned by backend
                headers: {
                  'Content-Type': file.type, // Send correct Content-Type
                },
              });
            })
            .catch(() => {
              reject('Error getting signed URL');
            });
        });
      },
      // getUploadParameters: async (file) => {
      //   const response = await fetch('http://localhost:3001/s3/multipart', {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       fileName: file.name,
      //       fileType: file.type,
      //     }),
      //   });
      //   const data = await response.json();
      //   console.log('getUploadParameters response:', data); // Add this line
      //   if (!data || !data.uploadId || !data.key || !data.bucket) {
      //     throw new Error('Invalid response from getUploadParameters');
      //   }
      //   return {
      //     method: 'PUT',
      //     url: `https://customsbuckets.s3.us-west-2.amazonaws.com/${data.key}`,
      //     headers: {
      //       'Content-Type': file.type,
      //       'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      //       'x-amz-credential': `${process.env.AWS_ACCESS_KEY_ID}/${new Date().toISOString().split('T')[0]}/${process.env.AWS_REGION}/s3/aws4_request`,
      //       'x-amz-date': new Date().toISOString().replace(/[:\-]|\.\d{3}/g, ''),
      //       'x-amz-signature': data.signature,
      //     },
      //   };
      // },
      partSize: 50 * 1024 * 1024, // Minimum part size 5 MB
      alwaysUseMultipart: true, // <--- Ensure multipart upload for all files
      createMultipartUpload: async (file) => {
       
        const response = await fetch('http://localhost:3001/s3/multipart/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        });
        const data = await response.json();
        console.log('createMultipartUpload response:', data); // Add this line
        return data;
      },
      listParts: async ({ uploadId }) => {
        const response = await fetch(`http://localhost:3001/s3/multipart/${uploadId}/parts`, {
          method: 'GET',
        });
        const data = await response.json();
        console.log('listParts response:', data); // Add this line
        return data;
      },
      prepareUploadPart: async (partData, { uploadId }) => {
        const response = await fetch(`http://localhost:3001/s3/multipart/${uploadId}/${partData.partNumber}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        console.log('prepareUploadPart response:', data); // Add this line
        return data;
      },
      abortMultipartUpload: async ({ uploadId }) => {
        const response = await fetch(`http://localhost:3001/s3/multipart/${uploadId}/abort`, {
          method: 'POST',
        });
        const data = await response.json();
        console.log('abortMultipartUpload response:', data); // Add this line
        return data;
      },
      // completeMultipartUpload: async (file, uploadId, parts) => {
      //   const response = await fetch('http://localhost:3001/s3/multipart/complete', {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       fileName:"new.pdf",
      //       fileType: "application/pdf",
      //       uploadId,
      //       parts,
      //     }),
      //   });
      //   const data = await response.json();
      //   console.log('completeMultipartUpload response:', data); // Add this line
      //   return data;
      // },
      completeMultipartUpload: async (file, uploadId, parts) => {
        const response = await fetch('http://localhost:3001/s3/multipart/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            uploadId: uploadId.uploadId,
            test:uploadId,
            parts: uploadId.parts.map((part, index) => ({
              PartNumber: index + 1, // Ensure PartNumber is correctly set
              ETag: part.etag.replace(/"/g, ''), // Remove quotes from ETag
              'content-length': part.size,
            })),
          }),
        });
        const data = await response.json();
        console.log('completeMultipartUpload response:', data); // Add this line
        return data;
      },
      signPart: async (file, { uploadId, partNumber, body }) => {
        const response = await fetch(`http://localhost:3001/s3/multipart/${uploadId}/sign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            partNumber,
            fileName: file.name,
            contentLength: body.size,
            fileType: file.type,
          }),
        });
        const data = await response.json();
        console.log('signPart response:', data); // Add this line
        return {
          url: data.url,
          headers: data.headers,
        };
      },
      retryDelays: [0, 1000, 3000, 5000], // Retry delays in milliseconds
      limit: 5, // Upload 5 parts concurrently
      partSize: 50 * 1024 * 1024,
    });

    setUppy(uppyInstance);

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
