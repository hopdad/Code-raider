import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSession(sessionId) {
  const [buffer,    setBuffer]    = useState([]);
  const [roster,    setRoster]    = useState([]);
  const [progress,  setProgress]  = useState({ tried: 0, total: 10000 });
  const [teamFound, setTeamFound] = useState(null); // { code, foundBy }
  const [connected, setConnected] = useState(false);
  const [error,     setError]     = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io({ withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      socket.emit('session:join', { sessionId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('code:assign', ({ buffer }) => {
      setBuffer(buffer ?? []);
    });

    socket.on('session:roster',   setRoster);
    socket.on('session:progress', setProgress);

    socket.on('code:found', (event) => {
      setTeamFound(event);
      setTimeout(() => setTeamFound(null), 7000);
    });

    socket.on('error', ({ message }) => setError(message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  const markTried = useCallback(() => {
    if (!socketRef.current || !buffer[0]) return;
    socketRef.current.emit('code:tried', { code: buffer[0] });
  }, [buffer]);

  const markFound = useCallback(() => {
    if (!socketRef.current || !buffer[0]) return;
    socketRef.current.emit('code:found', { code: buffer[0] });
  }, [buffer]);

  return {
    buffer, roster, progress, teamFound,
    connected, error,
    markTried, markFound,
  };
}
