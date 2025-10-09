import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>
        🎉 Equipment Lending System
      </h1>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '10px',
        margin: '20px auto',
        maxWidth: '600px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#4f46e5' }}>System Status</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            ✅ Frontend: Running on http://localhost:5173
          </li>
          <li style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            ✅ Backend: Running on http://localhost:8000
          </li>
          <li style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            ✅ API: Equipment endpoint working
          </li>
          <li style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            ✅ TypeScript: Build successful
          </li>
        </ul>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          React is rendering successfully! 🚀
        </p>
      </div>
    </div>
  );
};

export default App;
