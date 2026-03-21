import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    window.location.href = `${BACKEND_URL}/api/auth/logout`;
  };

  useEffect(() => {
    const fetchSessionAndBoards = async () => {
      try {
        const sessionRes = await fetch(`${BACKEND_URL}/api/auth/session`, {
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });
        
        if (sessionRes.status === 401) {
          navigate('/login');
          return;
        }
        
        const sessionData = await sessionRes.json();
        setUser(sessionData.user);

        const boardsRes = await fetch(`${BACKEND_URL}/api/boards`, {
          credentials: 'include'
        });
        const boardsData = await boardsRes.json();
        if (Array.isArray(boardsData)) {
          setBoards(boardsData);
        } else {
          console.error('Expected array of boards, but got:', boardsData);
          setBoards([]); // Fallback to empty array to avoid .map() crash
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndBoards();
  }, [navigate]);

  const createBoard = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/boards`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errData = await res.json();
        alert(`Failed to create board: ${errData.error || 'Unknown error'}`);
        return;
      }

      const data = await res.json();
      if (data.boardId) {
        navigate(`/board/${data.boardId}`);
      }
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Dashboard...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <header style={{ 
        backgroundColor: 'white', 
        padding: '16px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ fontSize: '20px', color: '#1e293b' }}>Home/Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user && (
            <div style={{ marginRight: '10px', textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>{user.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', color: '#0f172a' }}>My Whiteboards</h2>
          <button 
            onClick={createBoard}
            style={{
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#4f46e5'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#6366f1'}
          >
            + Create New Board
          </button>
        </div>

        {boards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', backgroundColor: 'white', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
            <p style={{ color: '#64748b', fontSize: '18px' }}>No boards yet. Create your first one to get started!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {boards.map(board => (
              <div 
                key={board.id} 
                onClick={() => navigate(`/board/${board.id}`)}
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#334155' }}>{board.name}</div>
                <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                  Last updated: {new Date(board.updated_at).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '12px', color: '#6366f1', marginTop: 'auto' }}>Open Board →</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
