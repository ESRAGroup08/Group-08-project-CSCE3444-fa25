import React from 'react';
import { Link } from 'react-router-dom';

const Profile = () => {
  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Profile (Coming Soon)</h1>
        <p className="text-gray-300 mb-6">
          The profile page is under construction. This placeholder keeps routing stable during the build.
        </p>
        <Link to="/menu" className="btn">Back to Menu</Link>
      </div>
    </div>
  );
};

export default Profile;