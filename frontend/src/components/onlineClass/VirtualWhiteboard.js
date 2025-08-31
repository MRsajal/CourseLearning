import React, { useState, useRef, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const VirtualWhiteboard = ({ courseId, user, isLive = false }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState("pen");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillColor, setFillColor] = useState("#ffffff");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Drawing state
  const [currentPath, setCurrentPath] = useState([]);
  const [paths, setPaths] = useState([]);
  const [currentShape, setCurrentShape] = useState(null);

  // Tools available
  const tools = [
    { id: "pen", name: "Pen", icon: "✏️" },
    { id: "highlighter", name: "Highlighter", icon: "🖍️" },
    { id: "eraser", name: "Eraser", icon: "🧽" },
    { id: "line", name: "Line", icon: "📏" },
    { id: "rectangle", name: "Rectangle", icon: "▭" },
    { id: "circle", name: "Circle", icon: "○" },
    { id: "arrow", name: "Arrow", icon: "→" },
    { id: "text", name: "Text", icon: "T" },
    { id: "select", name: "Select", icon: "👆" },
    { id: "pan", name: "Pan", icon: "✋" },
  ];

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
    "#FFFFFF",
  ];

  const strokeWidths = [1, 2, 4, 6, 8, 12, 16, 20];

  // Initialize socket connection
  useEffect(() => {
    if (isLive && user?.role === "instructor") {
      const newSocket = io(
        process.env.REACT_APP_SOCKET_URL || "http://localhost:5000",
        {
          query: { courseId, userId: user.id, role: user.role },
        }
      );

      newSocket.on("connect", () => {
        setIsConnected(true);
        console.log("Connected to whiteboard");
      });

      newSocket.on("whiteboard-draw", (data) => {
        drawFromSocket(data);
      });

      newSocket.on("whiteboard-clear", () => {
        clearCanvas();
      });

      newSocket.on("participants-updated", (participantsList) => {
        setParticipants(participantsList);
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isLive, courseId, user]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.imageSmoothingEnabled = true;

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all paths
    paths.forEach((path) => drawPath(ctx, path));
  }, [canvasSize, paths]);

  // Get mouse/touch position relative to canvas
  const getCanvasPoint = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

      return {
        x: ((clientX - rect.left) * scaleX - pan.x) / zoom,
        y: ((clientY - rect.top) * scaleY - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Draw path on canvas
  const drawPath = (ctx, path) => {
    if (!path || path.points.length < 2) return;

    ctx.save();
    ctx.globalCompositeOperation =
      path.tool === "eraser" ? "destination-out" : "source-over";
    ctx.globalAlpha = path.tool === "highlighter" ? 0.5 : 1;
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.width;

    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);

    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }

    ctx.stroke();
    ctx.restore();
  };

  // Draw shape on canvas
  const drawShape = (ctx, shape) => {
    ctx.save();
    ctx.strokeStyle = shape.strokeColor;
    ctx.fillStyle = shape.fillColor;
    ctx.lineWidth = shape.strokeWidth;

    switch (shape.type) {
      case "rectangle":
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        if (shape.filled) {
          ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        }
        break;

      case "circle":
        const radius = Math.sqrt(shape.width ** 2 + shape.height ** 2) / 2;
        ctx.beginPath();
        ctx.arc(
          shape.x + shape.width / 2,
          shape.y + shape.height / 2,
          radius,
          0,
          2 * Math.PI
        );
        ctx.stroke();
        if (shape.filled) {
          ctx.fill();
        }
        break;

      case "line":
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.stroke();
        break;

      case "arrow":
        drawArrow(
          ctx,
          shape.x,
          shape.y,
          shape.x + shape.width,
          shape.y + shape.height
        );
        break;

      case "text":
        ctx.font = `${shape.fontSize || 16}px Arial`;
        ctx.fillStyle = shape.strokeColor;
        ctx.fillText(shape.text, shape.x, shape.y);
        break;
    }
    ctx.restore();
  };

  // Draw arrow
  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headlen = 15;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  // Handle mouse down
  const handleMouseDown = (e) => {
    e.preventDefault();
    const point = getCanvasPoint(e);

    if (currentTool === "pan") {
      setIsPanning(true);
      setLastPanPoint(point);
      return;
    }

    if (currentTool === "text") {
      setTextPosition(point);
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);

    if (["pen", "highlighter", "eraser"].includes(currentTool)) {
      const newPath = {
        tool: currentTool,
        color: strokeColor,
        width: strokeWidth,
        points: [point],
      };
      setCurrentPath(newPath);
    } else if (["line", "rectangle", "circle", "arrow"].includes(currentTool)) {
      const newShape = {
        type: currentTool,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        strokeColor,
        fillColor,
        strokeWidth,
        filled: false,
      };
      setCurrentShape(newShape);
    }

    // Save state for undo
    saveState();
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    e.preventDefault();
    const point = getCanvasPoint(e);

    if (isPanning && currentTool === "pan") {
      const deltaX = (point.x - lastPanPoint.x) * zoom;
      const deltaY = (point.y - lastPanPoint.y) * zoom;
      setPan((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      return;
    }

    if (!isDrawing) return;

    if (["pen", "highlighter", "eraser"].includes(currentTool)) {
      setCurrentPath((prev) => ({
        ...prev,
        points: [...prev.points, point],
      }));
    } else if (["line", "rectangle", "circle", "arrow"].includes(currentTool)) {
      setCurrentShape((prev) => ({
        ...prev,
        width: point.x - prev.x,
        height: point.y - prev.y,
      }));
    }
  };

  // Handle mouse up
  const handleMouseUp = (e) => {
    e.preventDefault();

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;

    setIsDrawing(false);

    if (["pen", "highlighter", "eraser"].includes(currentTool)) {
      if (currentPath.points.length > 1) {
        setPaths((prev) => [...prev, currentPath]);

        // Emit to socket if live
        if (socket && isConnected) {
          socket.emit("whiteboard-draw", {
            type: "path",
            data: currentPath,
            courseId,
          });
        }
      }
      setCurrentPath([]);
    } else if (["line", "rectangle", "circle", "arrow"].includes(currentTool)) {
      if (
        currentShape &&
        (Math.abs(currentShape.width) > 5 || Math.abs(currentShape.height) > 5)
      ) {
        setPaths((prev) => [...prev, { type: "shape", shape: currentShape }]);

        // Emit to socket if live
        if (socket && isConnected) {
          socket.emit("whiteboard-draw", {
            type: "shape",
            data: currentShape,
            courseId,
          });
        }
      }
      setCurrentShape(null);
    }
  };

  // Handle text input
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      const textShape = {
        type: "text",
        x: textPosition.x,
        y: textPosition.y,
        text: textInput,
        strokeColor,
        fontSize: strokeWidth * 2 + 12,
      };

      setPaths((prev) => [...prev, { type: "shape", shape: textShape }]);

      // Emit to socket if live
      if (socket && isConnected) {
        socket.emit("whiteboard-draw", {
          type: "shape",
          data: textShape,
          courseId,
        });
      }
    }

    setTextInput("");
    setShowTextInput(false);
    setCurrentTool("pen");
  };

  // Save current state for undo
  const saveState = () => {
    setUndoStack((prev) => [...prev, [...paths]]);
    setRedoStack([]);
  };

  // Undo action
  const undo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [paths, ...prev]);
      setPaths(previousState);
      setUndoStack((prev) => prev.slice(0, -1));
    }
  };

  // Redo action
  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setUndoStack((prev) => [...prev, paths]);
      setPaths(nextState);
      setRedoStack((prev) => prev.slice(1));
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    saveState();
    setPaths([]);
    setCurrentPath([]);
    setCurrentShape(null);

    if (socket && isConnected) {
      socket.emit("whiteboard-clear", { courseId });
    }
  };

  // Save whiteboard
  const saveWhiteboard = async () => {
    try {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL("image/png");

      const response = await axios.post(
        "/api/whiteboard/save",
        {
          courseId,
          imageData: dataURL,
          paths: JSON.stringify(paths),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("Whiteboard saved successfully!");
    } catch (error) {
      console.error("Error saving whiteboard:", error);
      alert("Failed to save whiteboard");
    }
  };

  // Load whiteboard
  const loadWhiteboard = async () => {
    try {
      const response = await axios.get(`/api/whiteboard/load/${courseId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.paths) {
        setPaths(JSON.parse(response.data.paths));
      }
    } catch (error) {
      console.error("Error loading whiteboard:", error);
    }
  };

  // Draw from socket data
  const drawFromSocket = (data) => {
    if (data.type === "path") {
      setPaths((prev) => [...prev, data.data]);
    } else if (data.type === "shape") {
      setPaths((prev) => [...prev, { type: "shape", shape: data.data }]);
    }
  };

  // Render current drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Clear and redraw
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all saved paths
    paths.forEach((path) => {
      if (path.type === "shape") {
        drawShape(ctx, path.shape);
      } else {
        drawPath(ctx, path);
      }
    });

    // Draw current path
    if (currentPath.points && currentPath.points.length > 0) {
      drawPath(ctx, currentPath);
    }

    // Draw current shape
    if (currentShape) {
      drawShape(ctx, currentShape);
    }
  }, [paths, currentPath, currentShape]);

  return (
    <div className="virtual-whiteboard">
      {/* Toolbar */}
      <div className="whiteboard-toolbar">
        <div className="toolbar-section">
          <h3>Tools</h3>
          <div className="tools-grid">
            {tools.map((tool) => (
              <button
                key={tool.id}
                className={`tool-btn ${
                  currentTool === tool.id ? "active" : ""
                }`}
                onClick={() => setCurrentTool(tool.id)}
                title={tool.name}
              >
                <span className="tool-icon">{tool.icon}</span>
                <span className="tool-name">{tool.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <h3>Colors</h3>
          <div className="colors-grid">
            {colors.map((color) => (
              <button
                key={color}
                className={`color-btn ${strokeColor === color ? "active" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => setStrokeColor(color)}
              />
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <h3>Stroke Width</h3>
          <div className="stroke-width-selector">
            {strokeWidths.map((width) => (
              <button
                key={width}
                className={`width-btn ${strokeWidth === width ? "active" : ""}`}
                onClick={() => setStrokeWidth(width)}
              >
                <div
                  className="width-preview"
                  style={{
                    width: `${width * 2}px`,
                    height: `${width * 2}px`,
                    backgroundColor: strokeColor,
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <h3>Actions</h3>
          <div className="actions-grid">
            <button
              className="action-btn"
              onClick={undo}
              disabled={undoStack.length === 0}
            >
              ↶ Undo
            </button>
            <button
              className="action-btn"
              onClick={redo}
              disabled={redoStack.length === 0}
            >
              ↷ Redo
            </button>
            <button className="action-btn clear-btn" onClick={clearCanvas}>
              🗑️ Clear
            </button>
            <button className="action-btn save-btn" onClick={saveWhiteboard}>
              💾 Save
            </button>
            <button className="action-btn load-btn" onClick={loadWhiteboard}>
              📁 Load
            </button>
          </div>
        </div>

        {isLive && (
          <div className="toolbar-section">
            <h3>Live Session</h3>
            <div className="live-status">
              <div
                className={`connection-status ${
                  isConnected ? "connected" : "disconnected"
                }`}
              >
                {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
              </div>
              <div className="participants-count">
                👥 {participants.length} participants
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Canvas Container */}
      <div className="canvas-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            cursor: currentTool === "pan" ? "grab" : "crosshair",
          }}
        />

        {/* Zoom Controls */}
        <div className="zoom-controls">
          <button
            className="zoom-btn"
            onClick={() => setZoom((prev) => Math.min(prev + 0.1, 3))}
          >
            🔍+
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button
            className="zoom-btn"
            onClick={() => setZoom((prev) => Math.max(prev - 0.1, 0.1))}
          >
            🔍-
          </button>
          <button
            className="zoom-btn"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            🎯 Reset
          </button>
        </div>
      </div>

      {/* Text Input Modal */}
      {showTextInput && (
        <div className="text-input-modal">
          <div className="text-input-content">
            <h3>Add Text</h3>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleTextSubmit()}
            />
            <div className="text-input-actions">
              <button onClick={() => setShowTextInput(false)}>Cancel</button>
              <button onClick={handleTextSubmit}>Add Text</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualWhiteboard;
