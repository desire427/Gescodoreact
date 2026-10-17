import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BASE_URL, messagingApi } from '../services/api';

const DEFAULT_ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

function RemoteVideo({ stream, name }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div style={tileStyle}>
      <video ref={ref} autoPlay playsInline style={videoStyle} />
      <span style={nameStyle}>{name}</span>
    </div>
  );
}

export default function MeetingVideoRoom({ meeting, users, onClose }) {
  const { currentUser } = useAuth();
  const localVideo = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const peersRef = useRef(new Map());
  const [remoteStreams, setRemoteStreams] = useState({});
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Connexion à la visioconférence…');
  const userId = Number(currentUser?.id);

  const closePeer = useCallback((peerId) => {
    const peer = peersRef.current.get(Number(peerId));
    peer?.connection.close();
    peersRef.current.delete(Number(peerId));
    setRemoteStreams(previous => {
      const next = { ...previous };
      delete next[peerId];
      return next;
    });
  }, []);

  useEffect(() => {
    let disposed = false;
    let socket;

    const iceServers = (() => {
      if (!import.meta.env.VITE_WEBRTC_ICE_SERVERS) return DEFAULT_ICE_SERVERS;
      const parsed = JSON.parse(import.meta.env.VITE_WEBRTC_ICE_SERVERS);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('La configuration ICE doit contenir au moins un serveur.');
      }
      return parsed;
    })();

    async function connect() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('La caméra et le microphone nécessitent HTTPS ou localhost.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (disposed) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (localVideo.current) localVideo.current.srcObject = stream;

        const { data } = await messagingApi.websocketTicket();
        if (disposed) return;
        const endpoint = new URL(BASE_URL);
        endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:';
        endpoint.pathname = `${endpoint.pathname.replace(/\/$/, '')}/ws/meetings/${meeting.id}/`;
        endpoint.search = new URLSearchParams({ ticket: data.ticket }).toString();
        socket = new WebSocket(endpoint);
        socketRef.current = socket;

        function send(message) {
          if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
        }

        async function getPeer(peerId) {
          const key = Number(peerId);
          if (key === userId) return null;
          let record = peersRef.current.get(key);
          if (record) return record;
          const connection = new RTCPeerConnection({ iceServers });
          record = { connection, pendingCandidates: [] };
          peersRef.current.set(key, record);
          stream.getTracks().forEach(track => connection.addTrack(track, stream));
          connection.onicecandidate = ({ candidate }) => {
            if (candidate) send({
              type: 'ice-candidate',
              target_user_id: key,
              candidate: candidate.toJSON(),
            });
          };
          connection.ontrack = ({ streams: remote }) => {
            if (remote[0]) {
              setRemoteStreams(previous => ({ ...previous, [key]: remote[0] }));
            }
          };
          connection.onconnectionstatechange = () => {
            if (['failed', 'closed'].includes(connection.connectionState)) closePeer(key);
          };
          return record;
        }

        async function offerTo(peerId) {
          try {
            const record = await getPeer(peerId);
            if (!record || record.connection.signalingState !== 'stable') return;
            const offer = await record.connection.createOffer();
            await record.connection.setLocalDescription(offer);
            send({
              type: 'offer',
              target_user_id: Number(peerId),
              description: record.connection.localDescription.toJSON(),
            });
          } catch (offerError) {
            setError(`Impossible de joindre le participant : ${offerError.message}`);
          }
        }

        socket.onopen = () => send({ type: 'join' });
        socket.onmessage = async ({ data: raw }) => {
          try {
            const event = JSON.parse(raw);
            if (event.type === 'meeting.ready') {
              setStatus('Salle vidéo prête');
              for (const peerId of event.participant_ids || []) {
                if (userId < Number(peerId)) await offerTo(peerId);
              }
            } else if (event.type === 'meeting.peer_joined') {
              if (userId < Number(event.user_id)) await offerTo(event.user_id);
            } else if (event.type === 'meeting.peer_left') {
              closePeer(event.user_id);
            } else if (event.type === 'meeting.signal') {
              const record = await getPeer(event.from_user_id);
              if (!record) return;
              if (event.signal_type === 'offer') {
                await record.connection.setRemoteDescription(event.description);
                const answer = await record.connection.createAnswer();
                await record.connection.setLocalDescription(answer);
                send({
                  type: 'answer',
                  target_user_id: Number(event.from_user_id),
                  description: record.connection.localDescription.toJSON(),
                });
                for (const candidate of record.pendingCandidates) {
                  await record.connection.addIceCandidate(candidate);
                }
                record.pendingCandidates = [];
              } else if (event.signal_type === 'answer') {
                await record.connection.setRemoteDescription(event.description);
                for (const candidate of record.pendingCandidates) {
                  await record.connection.addIceCandidate(candidate);
                }
                record.pendingCandidates = [];
              } else if (event.signal_type === 'ice-candidate' && event.candidate) {
                if (record.connection.remoteDescription) {
                  await record.connection.addIceCandidate(event.candidate);
                } else {
                  record.pendingCandidates.push(event.candidate);
                }
              }
            } else if (event.type === 'error') {
              setError(event.detail || 'Signalisation vidéo refusée.');
            }
          } catch (signalError) {
            setError(`Erreur de signalisation vidéo : ${signalError.message}`);
          }
        };
        socket.onerror = () => setError('La connexion à la visioconférence a été interrompue.');
        socket.onclose = event => {
          if (!disposed && event.code !== 1000) {
            setError('Accès à la salle vidéo refusé ou connexion perdue.');
          }
        };
      } catch (connectionError) {
        setError(connectionError?.response?.data?.detail || connectionError.message);
      }
    }

    connect();
    return () => {
      disposed = true;
      socket?.close(1000);
      peersRef.current.forEach(({ connection }) => connection.close());
      peersRef.current.clear();
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };
  }, [meeting.id, userId, closePeer]);

  function toggleAudio() {
    streamRef.current?.getAudioTracks().forEach(track => { track.enabled = muted; });
    setMuted(previous => !previous);
  }

  function toggleCamera() {
    streamRef.current?.getVideoTracks().forEach(track => { track.enabled = cameraOff; });
    setCameraOff(previous => !previous);
  }

  function leave() {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'leave' }));
      socketRef.current.close(1000);
    }
    onClose();
  }

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={`Visioconférence : ${meeting.title}`}>
      <div style={panelStyle}>
        <header style={headerStyle}>
          <div>
            <strong>{meeting.title}</strong>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{status}</div>
          </div>
          <button type="button" onClick={leave} aria-label="Fermer la visioconférence" style={iconButtonStyle}>
            <X size={20} />
          </button>
        </header>
        {error && <div role="alert" style={errorStyle}>{error}</div>}
        <div style={gridStyle}>
          <div style={tileStyle}>
            <video ref={localVideo} autoPlay muted playsInline style={videoStyle} />
            <span style={nameStyle}>{currentUser?.name || 'Moi'} (vous)</span>
          </div>
          {Object.entries(remoteStreams).map(([id, stream]) => (
            <RemoteVideo key={id} stream={stream} name={users.find(user => Number(user.id) === Number(id))?.name || `Participant ${id}`} />
          ))}
        </div>
        <footer style={controlsStyle}>
          <button type="button" onClick={toggleAudio} style={iconButtonStyle} aria-label={muted ? 'Activer le microphone' : 'Couper le microphone'}>
            {muted ? <MicOff /> : <Mic />}
          </button>
          <button type="button" onClick={toggleCamera} style={iconButtonStyle} aria-label={cameraOff ? 'Activer la caméra' : 'Couper la caméra'}>
            {cameraOff ? <VideoOff /> : <Video />}
          </button>
          <button type="button" onClick={leave} style={leaveButtonStyle} aria-label="Quitter la visioconférence">
            <PhoneOff size={18} /> Quitter
          </button>
        </footer>
      </div>
    </div>
  );
}

const overlayStyle = { position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(2, 6, 23, .9)', display: 'grid', placeItems: 'center', padding: 16 };
const panelStyle = { width: 'min(1100px, 100%)', maxHeight: '95vh', overflow: 'auto', color: '#f8fafc', background: '#0f172a', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 };
const tileStyle = { minHeight: 190, position: 'relative', overflow: 'hidden', borderRadius: 12, background: '#1e293b', display: 'grid', placeItems: 'center' };
const videoStyle = { width: '100%', height: '100%', minHeight: 190, objectFit: 'cover' };
const nameStyle = { position: 'absolute', bottom: 8, left: 10, padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,.55)', fontSize: 12 };
const controlsStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 };
const iconButtonStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, color: '#f8fafc', background: '#334155', border: 0, borderRadius: 999, cursor: 'pointer' };
const leaveButtonStyle = { ...iconButtonStyle, width: 'auto', padding: '0 16px', gap: 8, background: '#dc2626' };
const errorStyle = { padding: 10, borderRadius: 8, color: '#fecaca', background: '#7f1d1d' };
