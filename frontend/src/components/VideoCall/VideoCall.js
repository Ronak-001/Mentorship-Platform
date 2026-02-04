import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiX } from 'react-icons/fi';
import './VideoCall.css';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

const VideoCall = ({ user }) => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    initializeCall();

    return () => {
      cleanup();
    };
  }, [roomId]);

  const initializeCall = async () => {
    try {
      // Get local stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      peerConnectionRef.current = new RTCPeerConnection(configuration);

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            roomId,
            candidate: event.candidate
          });
        }
      };

      // Join room
      socket.emit('join-room', roomId);

      // Handle offer
      socket.on('offer', async (offer) => {
        await peerConnectionRef.current.setRemoteDescription(offer);
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('answer', { roomId, answer });
      });

      // Handle answer
      socket.on('answer', async (answer) => {
        await peerConnectionRef.current.setRemoteDescription(answer);
      });

      // Handle ICE candidate
      socket.on('ice-candidate', async (data) => {
        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(data.candidate);
        }
      });

      // Create offer if first user
      socket.on('user-joined', async () => {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit('offer', { roomId, offer });
      });

    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const cleanup = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    socket.emit('leave-room', roomId);
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
        setIsAudioOn(!isAudioOn);
      }
    }
  };

  const endCall = () => {
    cleanup();
    window.close();
  };

  return (
    <div className="video-call-container">
      <div className="video-call-header glass">
        <h2>Video Call - {roomId}</h2>
        <button onClick={endCall} className="end-call-btn">
          <FiX /> End Call
        </button>
      </div>

      <div className="video-container">
        <div className="video-wrapper">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />
          ) : (
            <div className="waiting-remote glass">
              <p>Waiting for other participant...</p>
            </div>
          )}
        </div>

        <div className="local-video-wrapper">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
          />
        </div>
      </div>

      <div className="video-controls glass">
        <button
          onClick={toggleVideo}
          className={`control-btn ${!isVideoOn ? 'disabled' : ''}`}
        >
          {isVideoOn ? <FiVideo /> : <FiVideoOff />}
        </button>
        <button
          onClick={toggleAudio}
          className={`control-btn ${!isAudioOn ? 'disabled' : ''}`}
        >
          {isAudioOn ? <FiMic /> : <FiMicOff />}
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
