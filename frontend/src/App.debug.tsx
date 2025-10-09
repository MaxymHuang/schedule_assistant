import React from 'react';

const App: React.FC = () => {
  console.log('App component is rendering!');
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>
        🎉 Equipment Lending System - DEBUG MODE
      </h1>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '10px',
        margin: '20px auto',
        maxWidth: '600px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#4f46e5' }}>Debug Information</h2>
        <p>If you can see this, React is working!</p>
        <p>Check the browser console for the message: "App component is rendering!"</p>
        <div style={{ 
          backgroundColor: '#fef3c7', 
          padding: '10px', 
          borderRadius: '5px',
          margin: '10px 0'
        }}>
          <strong>Next Steps:</strong>
          <ol>
            <li>Check browser console for errors</li>
            <li>Check Network tab for failed requests</li>
            <li>If you see this message, React is working fine</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default App;
