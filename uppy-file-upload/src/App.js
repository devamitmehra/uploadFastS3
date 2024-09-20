import React from 'react';
import { UppyProvider } from './UppyProvider'; 
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './Home'; 
import Profile from './Profile'; 
import DraggableUploader from './DraggableUploader'; 
import './App.css';

const App = () => {
  return (
    <UppyProvider>
      <Router>
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

        {/* Page Routes */}
        <div className="page-content">
          <Routes>
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </div>

        {/* Uppy Uploader */}
        <DraggableUploader />
      </Router>
    </UppyProvider>
  );
};

export default App;

