import Uppy from '@uppy/core';
import AwsS3Multipart from '@uppy/aws-s3-multipart';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

export const createUppyInstance = () => {

  const uppyInstance = new Uppy({
    maxFileSize: null, 
    autoProceed: false, 
    debug: true,       
  });

  // Fetch presigned URLs for files
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

      presignedUrlsMap = urlsMap; // Save the presigned URLs
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
    endpoint: '/', 
    async getUploadParameters(file) {
      const presignedUrls = presignedUrlsMap;

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
    limit: 20, // Max parallel uploads
    partSize: 50 * 1024 * 1024, // Part size of 50 MB
  });

  return uppyInstance;
};
