import React, { useState } from 'react';
import UploadComponent from './UploadComponent';
import UploadComponentCamp from './UploadComponentCamp';
import UploadComponentCampMul from './UploadComponentCampMul';



const LandingPageComponent = () => {
  const [showUploadComponent, setShowUploadComponent] = useState(false);
  const [showUploadComponentCamp, setShowUploadComponentCamp] = useState(false);
  const [showUploadComponentCampMul, setShowUploadComponentCampMul] = useState(false);


  // Function to handle button click to show UploadComponent
  const handleShowUpload = () => {
    setShowUploadComponent(true);
  };
  const handleShowUploadCamp = () => {
    setShowUploadComponentCamp(true);
  };
  const handleShowUploadComponentCampMul = () => {
    setShowUploadComponentCampMul(true);
  };

  return (
    <div>
      <h1>Welcome to the Uppy File Upload Page</h1>
      
      {/* Show this button if the UploadComponent is not visible */}
      {!showUploadComponent && (
        <div>
          <button onClick={handleShowUpload}>Upload Files with presigned</button>
        </div>
      )}

        {!showUploadComponentCamp && (
        <div>
          <button onClick={handleShowUploadCamp}>Upload Files with campanion</button>
        </div>
      )}
       {!showUploadComponentCampMul && (
        <div>
          <button onClick={handleShowUploadComponentCampMul}>Upload Files with campanion multi</button>
        </div>
      )}

      {/* Show UploadComponent when the button is clicked */}
      {showUploadComponent && <UploadComponent />}

      {showUploadComponentCamp && <UploadComponentCamp />}
      {showUploadComponentCampMul && <UploadComponentCampMul />}

    </div>
  );
};

export default LandingPageComponent;
