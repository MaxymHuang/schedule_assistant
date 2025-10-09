import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333' }}>Equipment Lending System</h1>
      <p>This is a test to see if React is rendering properly.</p>
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <h2>System Status</h2>
        <p>✅ Frontend: Running</p>
        <p>✅ Backend: Running</p>
        <p>✅ API: Working</p>
      </div>
    </div>
  );
};

export default App;
