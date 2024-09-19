const express = require('express');
const { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand,PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// AWS S3 client setup
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const getSignedUrlPromise = (operation, params) => {
  return new Promise((resolve, reject) => {
    s3.getSignedUrl(operation, params, (err, url) => {
      if (err) {
        return reject(err);
      }
      resolve(url);
    });
  });
};


// Route to initiate multipart upload
app.post('/s3/multipart', async (req, res) => {
  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: 'File name and file type are required' });
  }

  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileName, // S3 object key (file name)
    ContentType: fileType, // MIME type of the file
  };

  try {
    const command = new CreateMultipartUploadCommand(s3Params);
    const data = await s3.send(command);
    res.json({
      uploadId: data.UploadId, // Return the uploadId for multipart upload
      key: fileName,
      bucket: process.env.S3_BUCKET,
    });
  } catch (err) {
    console.error('Error starting multipart upload:', err);
    res.status(500).json({ error: 'Error starting multipart upload' });
  }
});
// Route to sign a URL
app.post('/s3/multipart/:uploadId/sign', async (req, res) => {
  const { uploadId } = req.params;
  const { fileName, partNumber } = req.body;

  //console.log('Received request:', { uploadId, fileName, partNumber });

  if (!fileName || !partNumber) {
    return res.status(400).json({ error: 'File name and part number are required' });
  }

  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileName,
    PartNumber: parseInt(partNumber, 10),
    UploadId: uploadId,
  };

  try {
    const command = new UploadPartCommand(s3Params);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1-hour presigned URL
    res.json({ url });
  } catch (err) {
    console.error('Error generating presigned URL for part:', err);
    res.status(500).json({ error: 'Error generating presigned URL for part' });
  }
});


// Generate presigned URL for each part
app.get('/s3/multipart/:uploadId/:partNumber', async (req, res) => {
  const { uploadId, partNumber } = req.params;
  const { fileName } = req.query;

  if (!fileName) {
    return res.status(400).json({ error: 'File name is required' });
  }

  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileName,
    PartNumber: parseInt(partNumber, 10),
    UploadId: uploadId,
  };

  try {
    const command = new UploadPartCommand(s3Params);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1-hour presigned URL
    res.json({ url });
  } catch (err) {
    console.error('Error generating presigned URL for part:', err);
    res.status(500).json({ error: 'Error generating presigned URL for part' });
  }
});

// Complete the multipart upload
app.post('/s3/multipart/complete', async (req, res) => {
  const { fileName, fileType, uploadId, parts } = req.body;

  if (!fileName || !uploadId || !parts || parts.length === 0) {
    return res.status(400).json({ error: 'File name, uploadId, and parts are required' });
  }
//console.log(parts)
  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileName,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.map((part) => ({
        ETag: part.ETag,
        PartNumber: part.PartNumber,
      })),
    },
  };

  try {
    const command = new CompleteMultipartUploadCommand(s3Params);
    const data = await s3.send(command);
    res.json({ location: data.Location }); // Return final uploaded file location
  } catch (err) {
    console.error('Error completing multipart upload:', err);
    res.status(500).json({ error: 'Error completing multipart upload' });
  }
});

// Start the server

// Route to create a new multipart upload
app.post('/s3/multipart/create', async (req, res) => {
  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: 'File name and file type are required' });
  }

  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileName, // S3 object key (file name)
    ContentType: fileType, // MIME type of the file
  };

  try {
    const command = new CreateMultipartUploadCommand(s3Params);
    const data = await s3.send(command);
    res.json({
      uploadId: data.UploadId, // Return the uploadId for multipart upload
      key: fileName,
      bucket: process.env.S3_BUCKET,
    });
  } catch (err) {
    console.error('Error starting multipart upload:', err);
    res.status(500).json({ error: 'Error starting multipart upload' });
  }
});
app.post('/generate-presigned-url', async (req, res) => {
  const { fileName, fileType } = req.body;

  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileName, // The name of the file to be saved on S3
    ContentType: fileType, // File type (mime type)
    ACL: 'public-read', // Optional: Change the ACL if necessary
  };

  
  const command = new PutObjectCommand(s3Params);

  try {
    
    const url = await getSignedUrl(s3, command, { expiresIn: 600 });
    res.json({ url });
  } catch (err) {
    console.error('Error generating presigned URL', err);
    res.status(500).json({ error: 'Error generating presigned URL' });
  }
});


app.post('/generate-presigned-urls', async (req, res) => {
  const files = req.body.files; 
  const presignedUrls = [];

  try {
    for (const file of files) {
      const params = {
        Bucket: process.env.S3_BUCKET,
        Key: `uploads/${file.fileName}`, 
        ContentType: file.fileType, 
        ACL: 'public-read',
      };
      const command = new PutObjectCommand(params);

      const url = await getSignedUrl(s3, command, { expiresIn: 600 });
      presignedUrls.push({ url });
    }
    res.json({ urls: presignedUrls });
  } catch (error) {
    res.status(500).send('Error generating presigned URLs');
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});