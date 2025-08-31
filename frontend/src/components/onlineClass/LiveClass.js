import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useParams, useNavigate } from "react-router";
import "../CSS/LiveClass.css";

const LiveClass = ({ user, classData = null }) => {
  // State management
  const [isInClass, setIsInClass] = useState(false);
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [activeView, setActiveView] = useState("video"); // video, screen
  const [isRecording, setIsRecording] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [polls, setPolls] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [screenSharer, setScreenSharer] = useState(null); // Track who is sharing screen

  const { classId } = useParams();
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState(
    classData?.course?._id || classData?.course
  );

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const chatContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const peerConnectionsRef = useRef({});

  // WebRTC configuration
  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Initialize socket connection
  useEffect(() => {
    if (courseId) {
      const newSocket = io(
        process.env.REACT_APP_SOCKET_URL || "http://localhost:5000",
        {
          query: {
            courseId,
            userId: user.id,
            role: user.role,
            userName: user.name,
          },
        }
      );

      setSocket(newSocket);

      // Socket event listeners
      newSocket.on("connect", () => {
        console.log("Connected to live class");
      });

      newSocket.on("user-joined", handleUserJoined);
      newSocket.on("user-left", handleUserLeft);
      newSocket.on("offer", handleOffer);
      newSocket.on("answer", handleAnswer);
      newSocket.on("ice-candidate", handleIceCandidate);
      newSocket.on("chat-message", handleChatMessage);
      newSocket.on("participants-updated", setParticipants);
      newSocket.on("hand-raised", handleHandRaised);
      newSocket.on("poll-created", handlePollCreated);
      newSocket.on("poll-voted", handlePollVoted);
      newSocket.on("recording-started", () => setIsRecording(true));
      newSocket.on("recording-stopped", () => setIsRecording(false));
      newSocket.on("screen-share-started", handleScreenShareStarted);
      newSocket.on("screen-share-stopped", handleScreenShareStopped);
      newSocket.on("class-ended", handleClassEnded);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [courseId, user]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Socket event handlers
  const handleUserJoined = async (userData) => {
    console.log("User joined:", userData);
    if (userData.userId !== user.id && localStream) {
      await createPeerConnection(userData.userId);
    }
  };

  useEffect(() => {
    // If classData is not provided, fetch it using classId
    if (!classData && classId) {
      fetchClassData();
    } else if (classData) {
      setCourseId(classData.course?._id || classData.course);
    }
  }, [classId, classData]);

  const fetchClassData = async () => {
    try {
      const response = await axios.get(`/api/live-class/${classId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCourseId(response.data.course);
    } catch (error) {
      console.error("Error fetching class data:", error);
    }
  };

  const handleUserLeft = (userData) => {
    console.log("User left:", userData);
    if (peerConnectionsRef.current[userData.userId]) {
      peerConnectionsRef.current[userData.userId].close();
      delete peerConnectionsRef.current[userData.userId];
    }
    setRemoteStreams((prev) => {
      const newStreams = new Map(prev);
      newStreams.delete(userData.userId);
      return newStreams;
    });
  };

  const handleOffer = async (data) => {
    const { offer, from } = data;
    const peerConnection = await createPeerConnection(from);
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", { answer, to: from });
  };

  const handleAnswer = async (data) => {
    const { answer, from } = data;
    const peerConnection = peerConnectionsRef.current[from];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  };

  const handleIceCandidate = async (data) => {
    const { candidate, from } = data;
    const peerConnection = peerConnectionsRef.current[from];
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  };

  const handleChatMessage = (message) => {
    setChatMessages((prev) => [...prev, message]);
  };

  const handleHandRaised = (data) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "system",
        message: `${data.userName} raised their hand`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handlePollCreated = (poll) => {
    setPolls((prev) => [...prev, poll]);
    setActivePoll(poll);
  };

  const handlePollVoted = (pollData) => {
    setPolls((prev) =>
      prev.map((poll) => (poll.id === pollData.id ? pollData : poll))
    );
  };

  const handleClassEnded = () => {
    setIsInClass(false);
    stopAllMedia();
  };

  const handleScreenShareStarted = (data) => {
    setScreenSharer({ userId: data.userId, userName: data.userName });
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "system",
        message: `${data.userName} started sharing their screen`,
        timestamp: new Date().toISOString(),
      },
    ]);
    // Auto-switch to screen view for participants
    if (data.userId !== user.id) {
      setActiveView("screen");
    }
  };

  const handleScreenShareStopped = (data) => {
    setScreenSharer(null);
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "system",
        message: `${data.userName} stopped sharing their screen`,
        timestamp: new Date().toISOString(),
      },
    ]);
    // Auto-switch back to video view
    if (data.userId !== user.id) {
      setActiveView("video");
    }
  };

  // Create peer connection
  const createPeerConnection = async (userId) => {
    const peerConnection = new RTCPeerConnection(iceServers);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: userId,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.set(userId, event.streams[0]);
        return newStreams;
      });
    };

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    peerConnectionsRef.current[userId] = peerConnection;
    return peerConnection;
  };

  // Join class
  const joinClass = async () => {
    try {
      // Mark attendance
      await markAttendance();

      setIsInClass(true);
      socket.emit("join-class", {
        courseId,
        userId: user.id,
        userName: user.name,
        role: user.role,
      });

      // Get user media if instructor or has permission
      if (user.role === "instructor" || user.hasVideoPermission) {
        await initializeMedia();
      }
    } catch (error) {
      console.error("Error joining class:", error);
      alert("Failed to join class");
    }
  };

  // Leave class
  const leaveClass = () => {
    setIsInClass(false);
    socket.emit("leave-class", { courseId, userId: user.id });
    stopAllMedia();
  };

  // Initialize media
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsVideoOn(true);
      setIsAudioOn(true);
    } catch (error) {
      console.error("Error accessing media:", error);
      alert("Could not access camera/microphone");
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Store the original camera stream
      const originalStream = localStream;

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      Object.values(peerConnectionsRef.current).forEach((peerConnection) => {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Update local stream
      if (localStream) {
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
        }
        localStream.addTrack(videoTrack);
      }

      setIsScreenSharing(true);
      setActiveView("screen");

      // Notify other participants
      socket.emit("screen-share-started", {
        courseId,
        userId: user.id,
        userName: user.name,
      });

      // Handle screen share end
      videoTrack.onended = () => {
        stopScreenShare(originalStream);
      };
    } catch (error) {
      console.error("Error starting screen share:", error);
      alert("Could not start screen sharing. Please check permissions.");
    }
  };

  // Stop screen sharing
  const stopScreenShare = async (originalStream = null) => {
    try {
      let cameraStream = originalStream;

      // Get camera stream again if not provided
      if (!cameraStream) {
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (error) {
          console.error("Could not access camera after screen share:", error);
          // Continue without video if camera access fails
        }
      }

      if (cameraStream) {
        const videoTrack = cameraStream.getVideoTracks()[0];

        // Replace screen track with camera track in all peer connections
        Object.values(peerConnectionsRef.current).forEach((peerConnection) => {
          const sender = peerConnection
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });

        // Update local stream
        if (localStream) {
          const oldVideoTrack = localStream.getVideoTracks()[0];
          if (oldVideoTrack) {
            localStream.removeTrack(oldVideoTrack);
            oldVideoTrack.stop();
          }
          if (videoTrack) {
            localStream.addTrack(videoTrack);
          }
        }
      }

      setIsScreenSharing(false);
      setActiveView("video");

      // Notify other participants
      socket.emit("screen-share-stopped", {
        courseId,
        userId: user.id,
        userName: user.name,
      });
    } catch (error) {
      console.error("Error stopping screen share:", error);
    }
  };

  // Send chat message
  const sendChatMessage = () => {
    if (chatMessage.trim() && socket) {
      const message = {
        id: Date.now(),
        userId: user.id,
        userName: user.name,
        message: chatMessage,
        timestamp: new Date().toISOString(),
        type: "chat",
      };

      socket.emit("chat-message", { courseId, message });
      setChatMessage("");
    }
  };

  // Raise hand
  const raiseHand = () => {
    setHandRaised(!handRaised);
    socket.emit("raise-hand", {
      courseId,
      userId: user.id,
      userName: user.name,
      raised: !handRaised,
    });
  };

  // Start recording (instructor only)
  const startRecording = async () => {
    if (user.role !== "instructor") return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        // Upload recording
        uploadRecording(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      socket.emit("recording-started", { courseId });
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      socket.emit("recording-stopped", { courseId });
    }
  };

  // Upload recording
  const uploadRecording = async (blob) => {
    const formData = new FormData();
    formData.append("recording", blob, `class-${courseId}-${Date.now()}.webm`);
    formData.append("courseId", courseId);
    formData.append(
      "title",
      `Live Class Recording - ${new Date().toLocaleDateString()}`
    );

    try {
      await axios.post("/api/live-class/upload-recording", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("Recording uploaded successfully!");
    } catch (error) {
      console.error("Error uploading recording:", error);
      alert("Failed to upload recording");
    }
  };

  // Create poll (instructor only)
  const createPoll = () => {
    if (user.role !== "instructor") return;

    const question = prompt("Enter poll question:");
    const options = prompt("Enter options (comma separated):");

    if (question && options) {
      const poll = {
        id: Date.now(),
        question,
        options: options.split(",").map((opt) => opt.trim()),
        votes: {},
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };

      socket.emit("create-poll", { courseId, poll });
    }
  };

  // Vote on poll
  const votePoll = (pollId, optionIndex) => {
    socket.emit("vote-poll", {
      courseId,
      pollId,
      optionIndex,
      userId: user.id,
    });
  };

  // Mark attendance
  const markAttendance = async () => {
    try {
      await axios.post(
        "/api/live-class/attendance",
        {
          courseId,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setAttendanceMarked(true);
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  // Stop all media
  const stopAllMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    Object.values(peerConnectionsRef.current).forEach((peerConnection) => {
      peerConnection.close();
    });
    peerConnectionsRef.current = {};

    setRemoteStreams(new Map());
    setIsVideoOn(false);
    setIsAudioOn(false);
    setIsScreenSharing(false);
  };

  // End class (instructor only)
  const endClass = () => {
    if (user.role === "instructor") {
      socket.emit("end-class", { courseId });
      setIsInClass(false);
      stopAllMedia();
    }
  };

  // Go back to instructor dashboard my courses
  const goBack = () => {
    navigate('/instructor-dashboard?tab=my-courses');
  };

  if (!isInClass) {
    return (
      <div className="live-class-lobby">
        <div className="lobby-content">
          <div className="lobby-header">
            <button className="back-btn" onClick={goBack} title="Go back">
              ← Back
            </button>
            <h2>Live Class</h2>
          </div>
          <div className="class-info">
            <p>
              <strong>Course:</strong>{" "}
              {classData?.courseTitle || "Live Session"}
            </p>
            <p>
              <strong>Instructor:</strong>{" "}
              {classData?.instructorName || "Loading..."}
            </p>
            <p>
              <strong>Scheduled:</strong>{" "}
              {classData?.scheduledTime
                ? new Date(classData.scheduledTime).toLocaleString()
                : "Now"}
            </p>
          </div>

          <div className="pre-join-controls">
            <div className="media-preview">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="preview-video"
              />
            </div>

            <div className="media-controls">
              <button
                className={`control-btn ${isVideoOn ? "active" : "inactive"}`}
                onClick={toggleVideo}
              >
                📹 {isVideoOn ? "Video On" : "Video Off"}
              </button>
              <button
                className={`control-btn ${isAudioOn ? "active" : "inactive"}`}
                onClick={toggleAudio}
              >
                🎤 {isAudioOn ? "Mic On" : "Mic Off"}
              </button>
            </div>
          </div>

          <button className="join-btn" onClick={joinClass}>
            Join Class
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="live-class-room">
      {/* Header */}
      <div className="class-header">
        <button className="back-btn" onClick={goBack} title="Go back">
          ← Back
        </button>
        <div className="class-info">
          <h3>{classData?.courseTitle || "Live Class"}</h3>
          <div className="class-status">
            <span className="live-indicator">🔴 LIVE</span>
            <span className="participants-count">👥 {participants.length}</span>
            {isRecording && (
              <span className="recording-indicator">⏺️ Recording</span>
            )}
          </div>
        </div>

        <div className="class-controls">
          <button
            className={`control-btn ${activeView === "video" ? "active" : ""}`}
            onClick={() => setActiveView("video")}
          >
            📹 Video
          </button>
          <button
            className={`control-btn ${activeView === "screen" ? "active" : ""}`}
            onClick={() => setActiveView("screen")}
          >
            🖥️ Screen Share
          </button>
        </div>

        <button className="leave-btn" onClick={leaveClass}>
          Leave Class
        </button>
      </div>

      <div className="class-main">
        {/* Main Content Area */}
        <div className="live-class-main-content">
          {activeView === "video" && (
            <div className="video-grid">
              {/* Instructor/Main Video */}
              <div className="main-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="local-video"
                />
                <div className="video-info">
                  <span>{user.name} (You)</span>
                  {user.role === "instructor" && (
                    <span className="role-badge">Instructor</span>
                  )}
                </div>
              </div>

              {/* Remote Videos */}
              <div className="remote-videos">
                {Array.from(remoteStreams.entries()).map(([userId, stream]) => {
                  const participant = participants.find(
                    (p) => p.userId === userId
                  );
                  return (
                    <div key={userId} className="remote-video-container">
                      <video
                        ref={(el) => (remoteVideosRef.current[userId] = el)}
                        autoPlay
                        playsInline
                        onLoadedMetadata={() => {
                          if (remoteVideosRef.current[userId]) {
                            remoteVideosRef.current[userId].srcObject = stream;
                          }
                        }}
                        className="remote-video"
                      />
                      <div className="video-info">
                        <span>{participant?.userName || "Unknown"}</span>
                        {participant?.role === "instructor" && (
                          <span className="role-badge">Instructor</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeView === "screen" && (
            <div className="screen-share-view">
              <div className="screen-share-container">
                {isScreenSharing || screenSharer ? (
                  <div className="screen-content">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="screen-share-video"
                    />
                    <div className="screen-info">
                      <span>
                        🖥️ Screen being shared by{" "}
                        {isScreenSharing
                          ? user.name
                          : screenSharer?.userName || "Someone"}
                      </span>
                      {isScreenSharing && user.role === "instructor" && (
                        <button
                          className="stop-screen-share-btn"
                          onClick={stopScreenShare}
                        >
                          Stop Sharing
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="screen-placeholder">
                    <div className="placeholder-content">
                      <h3>No screen being shared</h3>
                      <p>Waiting for someone to start screen sharing...</p>
                      <button
                        className="start-screen-share-btn"
                        onClick={startScreenShare}
                      >
                        🖥️ Start Screen Share
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Small video thumbnails when screen sharing */}
              {(isScreenSharing || screenSharer) && (
                <div className="screen-share-thumbnails">
                  <div className="thumbnail-container">
                    <video
                      className="thumbnail-video"
                      autoPlay
                      muted
                      playsInline
                    />
                    <span className="thumbnail-label">{user.name} (You)</span>
                  </div>
                  {Array.from(remoteStreams.entries()).map(
                    ([userId, stream]) => {
                      const participant = participants.find(
                        (p) => p.userId === userId
                      );
                      return (
                        <div key={userId} className="thumbnail-container">
                          <video
                            ref={(el) => {
                              if (el) el.srcObject = stream;
                            }}
                            autoPlay
                            playsInline
                            className="thumbnail-video"
                          />
                          <span className="thumbnail-label">
                            {participant?.userName || "Unknown"}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="class-sidebar">
          {/* Participants */}
          <div className="sidebar-section">
            <h4>Participants ({participants.length})</h4>
            <div className="participants-list">
              {participants.map((participant) => (
                <div key={participant.userId} className="participant-item">
                  <span className="participant-name">
                    {participant.userName}
                  </span>
                  {participant.role === "instructor" && (
                    <span className="role-badge">Instructor</span>
                  )}
                  {participant.handRaised && (
                    <span className="hand-raised">✋</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="sidebar-section chat-section">
            <h4>Chat</h4>
            <div className="chat-messages" ref={chatContainerRef}>
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.type}`}>
                  {msg.type === "chat" ? (
                    <>
                      <span className="chat-username">{msg.userName}:</span>
                      <span className="chat-text">{msg.message}</span>
                    </>
                  ) : (
                    <span className="system-message">{msg.message}</span>
                  )}
                  <span className="chat-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Type a message..."
              />
              <button onClick={sendChatMessage}>Send</button>
            </div>
          </div>

          {/* Active Poll */}
          {activePoll && (
            <div className="sidebar-section">
              <h4>Poll</h4>
              <div className="poll-container">
                <p className="poll-question">{activePoll.question}</p>
                <div className="poll-options">
                  {activePoll.options.map((option, index) => (
                    <button
                      key={index}
                      className="poll-option"
                      onClick={() => votePoll(activePoll.id, index)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bottom-controls">
        <div className="media-controls">
          <button
            className={`control-btn ${isVideoOn ? "active" : "inactive"}`}
            onClick={toggleVideo}
            title={isVideoOn ? "Turn off camera" : "Turn on camera"}
          >
            📹
          </button>
          <button
            className={`control-btn ${isAudioOn ? "active" : "inactive"}`}
            onClick={toggleAudio}
            title={isAudioOn ? "Mute microphone" : "Unmute microphone"}
          >
            🎤
          </button>
          <button
            className={`control-btn ${isScreenSharing ? "active" : "inactive"}`}
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            title={
              isScreenSharing ? "Stop screen sharing" : "Start screen sharing"
            }
          >
            🖥️ {isScreenSharing ? "Stop Share" : "Share Screen"}
          </button>
        </div>

        <div className="interaction-controls">
          <button
            className={`control-btn ${handRaised ? "active" : "inactive"}`}
            onClick={raiseHand}
          >
            ✋
          </button>

          {user.role === "instructor" && (
            <>
              <button className="control-btn" onClick={createPoll}>
                📊 Poll
              </button>
              <button
                className={`control-btn ${isRecording ? "active" : "inactive"}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                ⏺️ {isRecording ? "Stop" : "Record"}
              </button>
              <button className="control-btn danger" onClick={endClass}>
                🛑 End Class
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveClass;
