import Draggable from 'react-draggable';

import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import Home from './Home';
import Profile from './Profile';
import DraggableUploader from './DraggableUploader';
import './App.css';

const App = () => {
  const [uploaders, setUploaders] = useState([1]);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddUploader = () => {
    setUploaders([...uploaders, uploaders.length + 1]); 
  };

  const handleUploadProgress = (uploadingStatus) => {
    setIsUploading(uploadingStatus); 
  };

  return (
    <Router>
      <div>
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="navbar-logo">
            <h2>FileUploader</h2>
          </div>
          <ul className="navbar-links">
            <li>
              <Link to="/" className="nav-link">Home</Link>
            </li>
            <li>
              <Link to="/profile" className="nav-link">Profile</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<Home />} />
        </Routes>

        <HomeUploaderSection
          handleAddUploader={handleAddUploader}
          uploaders={uploaders}
          handleUploadProgress={handleUploadProgress}
          isUploading={isUploading}
        />
      </div>
    </Router>
  );
};

const HomeUploaderSection = ({ handleAddUploader, uploaders, handleUploadProgress, isUploading }) => {
  const location = useLocation(); // Get current route

  const isHomePage = location.pathname === '/'; // Check if it's the home page

  return (
    <div>
      {isHomePage && (
        <button onClick={handleAddUploader} style={{ margin: '20px' }}>
          Add New Uploader
        </button>
      )}

   
      {(isHomePage || isUploading) && (
        <DraggableContainer isHomePage={isHomePage}>
          {uploaders.map((uploaderKey) => (
            <DraggableUploader
              key={uploaderKey}
              instanceKey={uploaderKey}
              isOnHome={isHomePage} // Pass whether it's the home page
              handleUploadProgress={handleUploadProgress} // Handle upload progress tracking
            />
          ))}
        </DraggableContainer>
      )}
    </div>
  );
};

const DraggableContainer = ({ isHomePage, children }) => {
  return (
    <Draggable disabled={isHomePage}>
      <div
        style={{
          position: isHomePage ? 'relative' : 'fixed',
          right: 0,
          bottom: 0,
          zIndex: 1000,
          overflowY: 'auto',
          maxHeight: '90vh',
          width: 'auto',
          padding: '10px',
          backgroundColor: 'white',
          border: isHomePage ? 'none' : '1px solid #ddd',
          boxShadow: isHomePage ? 'none' : '0px 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
        }}
      >
        {children}
      </div>
    </Draggable>
  );
};

export default App;
