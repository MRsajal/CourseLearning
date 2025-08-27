import React, { useEffect, useState } from "react";
import axios from "axios";
import "../CSS/CourseMaterials.css";
import "../CSS/Button.css";
import "../CSS/Forms.css";

const CourseMaterials = ({ courseId, user, isOwner = false }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    order: 0,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMaterials();
  }, [courseId]);
  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/courses/${courseId}/materials`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMaterials(response.data);
    } catch (error) {
      console.error("Error fetching materials:", error);
      setMessage("Error loading materials");
    } finally {
      setLoading(false);
    }
  };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file && !uploadForm.title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setUploadForm((prev) => ({ ...prev, title: nameWithoutExt }));
    }
  };
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage("Please select a file to upload");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("order", uploadForm.order);

      await axios.post(`/api/courses/${courseId}/materials`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("File uploaded successfully!");
      setShowUploadForm(false);
      setUploadForm({ title: "", description: "", order: 0 });
      setSelectedFile(null);
      fetchMaterials();
    } catch (error) {
      setMessage(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const handleDelete = async (materialId) => {
    if (!window.confirm("Are you sure you want to delete this material?"))
      return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/materials/${materialId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage("Material deleted successfully");
      fetchMaterials();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed");
    }
  };
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "pdf":
        return "📄";
      case "video":
        return "🎥";
      default:
        return "📁";
    }
  };
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: `${40}px`,
            height: `${40}px`,
            borderWidth: `${4}px`,
            borderColor: "#89A8B2",
            borderTopColor: "transparent",
            borderStyle: "solid",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }
  return (
    <div className="course-materials">
      <div className="materials-header">
        <h3>Course Materials</h3>
        {isOwner && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="btn-primary"
          >
            {showUploadForm ? "Cancel" : "Upload Material"}
          </button>
        )}
      </div>

      {message && (
        <div
          className={`message ${
            message.includes("success") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}

      {showUploadForm && isOwner && (
        <div className="upload-form">
          <h4>Upload New Material</h4>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label htmlFor="file">Select File *</label>
              <input
                type="file"
                id="file"
                accept=".pdf,.mp4,.avi,.mov,.wmv,.doc,.docx,.txt"
                onChange={handleFileSelect}
                required
              />
              <small>
                Supported formats: PDF, Video files (MP4, AVI, MOV, WMV),
                Documents (DOC, DOCX, TXT)
              </small>
              <small>Maximum file size: 500MB</small>
            </div>

            {selectedFile && (
              <div className="file-preview">
                <p>
                  <strong>Selected:</strong> {selectedFile.name} (
                  {formatFileSize(selectedFile.size)})
                </p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                value={uploadForm.title}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows="3"
                placeholder="Optional description for this material"
              />
            </div>

            <div className="form-group">
              <label htmlFor="order">Order</label>
              <input
                type="number"
                id="order"
                value={uploadForm.order}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, order: e.target.value }))
                }
                min="0"
                placeholder="Display order (0 = first)"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={uploading}
                className="btn-primary"
              >
                {uploading ? "Uploading..." : "Upload Material"}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="materials-list">
        {materials.length === 0 ? (
          <div className="no-materials">
            <p>No materials uploaded yet.</p>
            {isOwner && <p>Upload your first material to get started!</p>}
          </div>
        ) : (
          materials.map((material) => (
            <div key={material._id} className="material-item">
              <div className="material-icon">{getFileIcon(material.type)}</div>

              <div className="material-info">
                <h4>{material.title}</h4>
                {material.description && (
                  <p className="material-description">{material.description}</p>
                )}
                <div className="material-meta">
                  <span className="material-type">
                    {material.type.toUpperCase()}
                  </span>
                  <span className="material-size">
                    {formatFileSize(material.fileSize)}
                  </span>
                  <span className="material-date">
                    Uploaded:{" "}
                    {new Date(material.uploadedAt).toLocaleDateString()}
                  </span>
                  {isOwner && (
                    <span className="material-uploader">
                      by {material.uploadedBy.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="material-actions">
                <a
                  href={`/api/materials/${material._id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-download"
                  onClick={(e) => {
                    // Add auth header for download
                    const token = localStorage.getItem("token");
                    if (token) {
                      // For downloads, we'll handle this differently
                      e.preventDefault();
                      window.open(
                        `/api/materials/${material._id}/download?token=${token}`,
                        "_blank"
                      );
                    }
                  }}
                >
                  {material.type === "video" ? "Watch" : "View/Download"}
                </a>

                {isOwner && (
                  <button
                    onClick={() => handleDelete(material._id)}
                    className="btn-delete-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseMaterials;
