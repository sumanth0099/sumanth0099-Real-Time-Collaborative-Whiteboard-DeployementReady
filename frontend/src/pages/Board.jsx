import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { Stage, Layer, Line, Rect, Circle, Text } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export default function Board() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({}); // Map<userId, {x, y, name}>
  const [socket, setSocket] = useState(null);
  
  const objects = useStore((state) => state.objects);
  const addObject = useStore((state) => state.addObject);
  const updateObject = useStore((state) => state.updateObject);
  const setObjects = useStore((state) => state.setObjects);
  const applyUndo = useStore((state) => state.applyUndo);
  const applyRedo = useStore((state) => state.applyRedo);
  const removeObjectRemote = useStore((state) => state.removeObjectRemote);
  const currentTool = useStore((state) => state.currentTool);
  const setCurrentTool = useStore((state) => state.setCurrentTool);
  const brushColor = useStore((state) => state.brushColor);
  const setBrushColor = useStore((state) => state.setBrushColor);
  const brushSize = useStore((state) => state.brushSize);
  const setBrushSize = useStore((state) => state.setBrushSize);

  const isDrawing = useRef(false);
  const currentObjectId = useRef(null);

  useEffect(() => {
    let newSocket;

    const initSocket = async () => {
      let userData = null;
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/session`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          userData = data.user;
        }

        // Fetch initial board state
        const boardRes = await fetch(`${BACKEND_URL}/api/boards/${boardId}`, { credentials: 'include' });
        if (boardRes.ok) {
          const boardData = await boardRes.json();
          if (boardData.objects) {
            setObjects(boardData.objects);
          }
        }
      } catch (err) {
        console.error('Session/Board fetch failed', err);
      }

      newSocket = io(BACKEND_URL, {
        withCredentials: true,
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        // Now pass the full user object (including test user info) to the room
        newSocket.emit('joinRoom', { boardId, user: userData });
      });

      newSocket.on('roomUsers', (payload) => {
        setUsers(payload.users || []);
      });

      newSocket.on('cursorUpdate', (payload) => {
        setRemoteCursors(prev => ({
          ...prev,
          [payload.userId]: { x: payload.x, y: payload.y }
        }));
      });

      newSocket.on('drawUpdate', (data) => {
        const currentObjects = useStore.getState().objects;
        if (currentObjects.find(o => o.id === data.id)) {
          updateObject(data.id, data);
        } else {
          addObject(data);
        }
      });

      newSocket.on('objectAdded', (data) => {
        addObject(data);
      });

      newSocket.on('objectRemoved', (id) => {
        removeObjectRemote(id);
      });
    };

    initSocket();

    // Expose for automated evaluation tests
    window.getCanvasAsJSON = () => {
      return useStore.getState().objects;
    };

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [boardId]);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    const id = uuidv4();
    currentObjectId.current = id;

    if (currentTool === 'pen') {
      const newObj = {
        id,
        type: 'pen',
        points: [pos.x, pos.y],
        color: brushColor,
        size: brushSize,
      };
      addObject(newObj, true);
      if (socket) {
        socket.emit('draw', { boardId, data: newObj });
      }
    } else if (currentTool === 'rectangle') {
      const newRect = {
        id,
        type: 'rectangle',
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        fill: brushColor,
      };
      addObject(newRect, true);
      if (socket) {
        socket.emit('addObject', { boardId, data: newRect });
      }
    } else if (currentTool === 'eraser') {
      const newEraser = {
        id,
        type: 'eraser',
        points: [pos.x, pos.y],
        size: brushSize,
      };
      addObject(newEraser, true);
      if (socket) {
        socket.emit('draw', { boardId, data: newEraser });
      }
    }
  };

  const handleMouseMove = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    
    // Broadcast cursor position
    if (socket) {
      socket.emit('cursorMove', { boardId, x: pos.x, y: pos.y });
    }

    if (!isDrawing.current) return;
    
    // Quick reference to current state
    const objectsList = useStore.getState().objects;
    const obj = objectsList.find(o => o.id === currentObjectId.current);
    if (!obj) return;

    if (currentTool === 'pen' && obj.type === 'pen') {
      const updatedLine = { points: [...obj.points, pos.x, pos.y] };
      updateObject(obj.id, updatedLine);
      if (socket) {
        socket.emit('draw', { boardId, data: { ...obj, ...updatedLine } });
      }
    } else if (currentTool === 'rectangle' && obj.type === 'rectangle') {
      const updatedRect = {
        width: pos.x - obj.x,
        height: pos.y - obj.y,
      };
      updateObject(obj.id, updatedRect);
      if (socket) {
        socket.emit('addObject', { boardId, data: { ...obj, ...updatedRect } });
      }
    } else if (currentTool === 'eraser' && obj.type === 'eraser') {
      const updatedLine = { points: [...obj.points, pos.x, pos.y] };
      updateObject(obj.id, updatedLine);
      if (socket) {
        socket.emit('draw', { boardId, data: { ...obj, ...updatedLine } });
      }
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    currentObjectId.current = null;
  };

  const handleUndo = () => {
    const action = applyUndo();
    if (action && socket) {
      if (action.type === 'add') {
        socket.emit('removeObject', { boardId, id: action.obj.id });
      }
    }
  };

  const handleRedo = () => {
    const action = applyRedo();
    if (action && socket) {
      if (action.type === 'add') {
        socket.emit('addObject', { boardId, data: action.obj });
      }
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/boards/${boardId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ objects }),
        credentials: 'include',
      });
      if (res.ok) {
        alert('Board saved successfully!');
      } else {
        alert('Failed to save board.');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving board.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '10px', background: '#f4f4f4', borderBottom: '1px solid #ccc', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Board {boardId}</h2>
        <button 
          data-testid="tool-pen"
          onClick={() => setCurrentTool('pen')} 
          style={{ fontWeight: currentTool === 'pen' ? 'bold' : 'normal', padding: '5px 10px' }}
        >
          Pen
        </button>
        <button 
          data-testid="tool-rectangle"
          onClick={() => setCurrentTool('rectangle')}
          style={{ fontWeight: currentTool === 'rectangle' ? 'bold' : 'normal', padding: '5px 10px' }}
        >
          Rectangle
        </button>
        <button 
          data-testid="tool-eraser"
          onClick={() => setCurrentTool('eraser')}
          style={{ fontWeight: currentTool === 'eraser' ? 'bold' : 'normal', padding: '5px 10px' }}
        >
          Eraser
        </button>

        <button 
          data-testid="undo-button"
          onClick={handleUndo} 
          style={{ padding: '5px 10px' }}
        >
          Undo
        </button>
        <button 
          data-testid="redo-button"
          onClick={handleRedo}
          style={{ padding: '5px 10px' }}
        >
          Redo
        </button>
        
        <div style={{ display: 'flex', gap: '5px', ml: 'auto' }}>
          {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'].map(color => (
            <div 
              key={color}
              onClick={() => setBrushColor(color)}
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: color,
                borderRadius: '50%',
                cursor: 'pointer',
                border: brushColor === color ? '2px solid #555' : '1px solid #ccc'
              }}
            />
          ))}
        </div>

        <input 
          type="color" 
          value={brushColor} 
          onChange={(e) => setBrushColor(e.target.value)} 
          title="Custom Color"
          style={{ cursor: 'pointer', border: 'none', background: 'transparent', width: '30px', height: '30px' }}
        />
        <input 
          type="range" 
          min="1" max="20" 
          value={brushSize} 
          onChange={(e) => setBrushSize(parseInt(e.target.value))} 
          title="Brush Size"
        />
        
        <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#555' }}>
          Users: {users.length} | {socket?.connected ? '✅ Connected' : '⏳ Connecting...'}
        </span>

        <button 
          onClick={() => navigate('/')} 
          style={{ padding: '5px 12px', cursor: 'pointer', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1' }}
        >
          Dashboard
        </button>
        <button 
          onClick={handleSave}
          style={{ padding: '5px 12px', cursor: 'pointer', backgroundColor: '#22c55e', border: '1px solid #16a34a', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}
        >
          Save Board
        </button>

        <button 
          onClick={() => window.location.href = `${BACKEND_URL}/api/auth/logout`}
          style={{ padding: '5px 12px', cursor: 'pointer', backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '4px' }}
        >
          Logout
        </button>
      </div>

      <div style={{ flex: 1, backgroundColor: '#fff', overflow: 'hidden' }}>
        <Stage
          width={window.innerWidth}
          height={window.innerHeight - 60}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          <Layer>
            {objects.map((obj) => {
              if (obj.type === 'pen') {
                return (
                  <Line
                    key={obj.id}
                    points={obj.points}
                    stroke={obj.color}
                    strokeWidth={obj.size}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation="source-over"
                  />
                );
              } else if (obj.type === 'rectangle') {
                return (
                  <Rect
                    key={obj.id}
                    x={obj.x}
                    y={obj.y}
                    width={obj.width}
                    height={obj.height}
                    fill={obj.fill}
                  />
                );
              } else if (obj.type === 'eraser') {
                return (
                  <Line
                    key={obj.id}
                    points={obj.points}
                    stroke="white"
                    strokeWidth={obj.size}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation="destination-out"
                  />
                );
              }
              return null;
            })}

            {/* Render Remote Cursors */}
            {Object.entries(remoteCursors).map(([userId, pos]) => {
              const userInList = users.find(u => u.id === userId);
              const label = userInList ? userInList.name : 'User';
              return (
                <React.Fragment key={userId}>
                  <Circle
                    data-testid="remote-cursor"
                    x={pos.x}
                    y={pos.y}
                    radius={5}
                    fill="red"
                  />
                  <Text
                    x={pos.x + 10}
                    y={pos.y - 10}
                    text={label}
                    fontSize={12}
                    fill="red"
                  />
                </React.Fragment>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
