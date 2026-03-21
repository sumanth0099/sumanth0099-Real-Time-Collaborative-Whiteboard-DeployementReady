import React from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  const handleTestLogin = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/test-login`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        navigate('/');
      } else {
        alert('Test login failed. Is submission.json present?');
      }
    } catch (err) {
      console.error('Test login error', err);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '40px',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }}>
        <h1 style={{ marginBottom: '10px' }}>Collaborative Whiteboard</h1>
        <p style={{ marginBottom: '30px', opacity: 0.8 }}>Draw together in real-time, anywhere.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button
            onClick={handleLogin}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#764ba2',
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: '0 auto',
              width: '100%',
              justifyContent: 'center'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
            Sign in with Google
          </button>

          <button
            onClick={handleTestLogin}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              width: '100%'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          >
            Sign in as Test User (Evaluation)
          </button>
        </div>
      </div>
    </div>
  );
}
