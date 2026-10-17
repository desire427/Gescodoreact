import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Phone, Video, VideoOff } from 'lucide-react';
import { BASE_URL, messagingApi } from '../services/api';
import { useApp } from '../context/AppContext';

const DEFAULT_ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export default function CallOverlay() {
  const {
    activeCall, incomingCall, answerCall, dismissIncomingCall, finishCall,
    getContact, messagingError,
  } = useApp();
  const call = activeCall || incomingCall;
  const waiting = !!incomingCall && !activeCall;
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [callError, setCallError] = useState('');
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const acceptedRef = useRef(!waiting);
  const callRef = useRef(call);
  const waitingRef = useRef(waiting);
  const finishCallRef = useRef(finishCall);
  const dismissIncomingCallRef = useRef(dismissIncomingCall);
  const preparePeerRef = useRef(null);
  const acceptOfferRef = useRef(null);

  acceptedRef.current = !waiting;
  callRef.current = call;
  waitingRef.current = waiting;
  finishCallRef.current = finishCall;
  dismissIncomingCallRef.current = dismissIncomingCall;

  useEffect(() => {
    if (!callRef.current) return undefined;
    let disposed = false;
    const connect = async () => {
      try {
        const { data } = await messagingApi.websocketTicket();
        if (disposed) return;
        const endpoint = new URL(BASE_URL);
        endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:';
        endpoint.pathname = `${endpoint.pathname.replace(/\/$/, '')}/ws/calls/${callRef.current.id}/`;
        endpoint.search = new URLSearchParams({ ticket: data.ticket }).toString();
        const socket = new WebSocket(endpoint);
        socketRef.current = socket;
        socket.onmessage = async ({ data: raw }) => {
          const event = JSON.parse(raw);
          if (event.type === 'offer') {
            pendingOfferRef.current = event.description;
            if (acceptedRef.current) await acceptOfferRef.current(event.description);
          } else if (event.type === 'answer' && peerRef.current) {
            await peerRef.current.setRemoteDescription(event.description);
          } else if (event.type === 'ice-candidate' && peerRef.current && event.candidate) {
            try {
              await peerRef.current.addIceCandidate(event.candidate);
            } catch (error) {
              setCallError(error.message);
            }
          } else if (event.type === 'accept') {
            if (callRef.current.direction === 'outgoing' && peerRef.current?.localDescription) {
              sendSignal('offer', { description: peerRef.current.localDescription });
            }
          } else if (event.type === 'decline' || event.type === 'end') {
            if (waitingRef.current) await dismissIncomingCallRef.current('decline');
            else await finishCallRef.current();
          }
        };
        socket.onerror = () => setCallError('La connexion de signalisation a été interrompue.');
        socket.onopen = async () => {
          if (callRef.current.direction !== 'outgoing') return;
          try {
            await preparePeerRef.current();
            const offer = await peerRef.current.createOffer();
            await peerRef.current.setLocalDescription(offer);
            sendSignal('offer', { description: peerRef.current.localDescription });
          } catch (error) {
            setCallError(`Impossible de démarrer l’appel : ${error.message}`);
          }
        };
      } catch (error) {
        setCallError(error?.response?.data?.detail || error.message);
      }
    };
    connect();
    return () => {
      disposed = true;
      socketRef.current?.close();
      peerRef.current?.close();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      socketRef.current = null;
      peerRef.current = null;
      localStreamRef.current = null;
    };
  }, [call?.id]);

  if (!call) return null;
  const contact = call.contact || getContact(call.contactId);

  function sendSignal(type, payload = {}) {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, ...payload }));
    }
  }

  async function preparePeer() {
    if (peerRef.current) return peerRef.current;
    const configured = import.meta.env.VITE_WEBRTC_ICE_SERVERS;
    let iceServers = DEFAULT_ICE_SERVERS;
    if (configured) {
      try {
        iceServers = JSON.parse(configured);
        if (!Array.isArray(iceServers) || iceServers.length === 0) {
          throw new Error('La configuration ICE doit être une liste non vide.');
        }
      } catch (error) {
        setCallError(`Configuration WebRTC invalide : ${error.message}`);
        throw error;
      }
    }
    const peer = new RTCPeerConnection({ iceServers });
    peerRef.current = peer;
    peer.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal('ice-candidate', { candidate: candidate.toJSON() });
    };
    peer.ontrack = ({ streams }) => {
      if (remoteVideo.current && streams[0]) remoteVideo.current.srcObject = streams[0];
    };
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callRef.current.callType === 'video',
    });
    localStreamRef.current = stream;
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    if (localVideo.current) localVideo.current.srcObject = stream;
    return peer;
  }

  async function acceptOffer(description = pendingOfferRef.current) {
    if (!description) return;
    try {
      const peer = await preparePeer();
      if (peer.signalingState !== 'stable') return;
      await peer.setRemoteDescription(description);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      sendSignal('answer', { description: peer.localDescription });
    } catch (error) {
      setCallError(`Impossible de rejoindre l’appel : ${error.message}`);
    }

    preparePeerRef.current = preparePeer;
    acceptOfferRef.current = acceptOffer;
  }

  async function handleAnswer() {
    await answerCall();
    acceptedRef.current = true;
    sendSignal('accept');
    if (pendingOfferRef.current) await acceptOffer(pendingOfferRef.current);
  }

  async function handleEnd() {
    sendSignal(waiting ? 'decline' : 'end');
    if (waiting) await dismissIncomingCall('decline');
    else await finishCall();
  }

  const toggleAudio = () => {
    localStreamRef.current?.getAudioTracks().forEach(track => { track.enabled = muted; });
    setMuted(value => !value);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(track => { track.enabled = cameraOff; });
    setCameraOff(value => !value);
  };

  return (
    <div className="call-overlay" role="dialog" aria-modal="true" aria-label="Appel audio vidéo">
      <div className="call-card">
        {call.callType === 'video' && !waiting && (
          <video ref={remoteVideo} autoPlay playsInline className="call-remote-video" />
        )}
        <video ref={localVideo} autoPlay muted playsInline className="call-local-video" />
        <img
          src={contact?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact?.name || '?')}`}
          alt=""
          className="avatar avatar-xl call-avatar"
        />
        <h2>{contact?.name || 'Contact'}</h2>
        <p>{waiting ? 'Appel entrant' : call.state === 'accepted' ? 'Appel en cours' : 'Appel en cours de connexion…'}</p>
        {(callError || messagingError) && <p className="call-error" role="alert">{callError || messagingError}</p>}
        <div className="call-controls">
          {!waiting && (
            <>
              <button type="button" onClick={toggleAudio} aria-label={muted ? 'Activer le micro' : 'Couper le micro'}>
                {muted ? <MicOff /> : <Mic />}
              </button>
              {call.callType === 'video' && (
                <button type="button" onClick={toggleVideo} aria-label={cameraOff ? 'Activer la caméra' : 'Couper la caméra'}>
                  {cameraOff ? <VideoOff /> : <Video />}
                </button>
              )}
            </>
          )}
          {waiting && (
            <button type="button" className="call-answer" onClick={handleAnswer} aria-label="Répondre">
              <Phone />
            </button>
          )}
          <button type="button" className="call-end" onClick={handleEnd} aria-label={waiting ? 'Refuser' : 'Terminer l’appel'}>
            <Phone />
          </button>
        </div>
      </div>
    </div>
  );
}
