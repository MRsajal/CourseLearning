import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import axios from "axios";
import "../CSS/Certificate.css";

const Certificate = ({ user }) => {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCertificateById = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/certificate/${certificateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCertificate(response.data.certificate);
    } catch (error) {
      setError(error.response?.data?.message || "Certificate not found");
    } finally {
      setLoading(false);
    }
  }, [certificateId]);

  useEffect(() => {
    if (certificateId) {
      fetchCertificateById();
    } else {
      setError("Certificate ID not provided");
      setLoading(false);
    }
  }, [certificateId, fetchCertificateById]);

  const downloadCertificate = () => {
    window.print();
  };

  const shareCertificate = () => {
    if (navigator.share) {
      navigator.share({
        title: `Certificate of Completion - ${certificate.courseName}`,
        text: `I have successfully completed ${certificate.courseName} with a score of ${certificate.finalScore}%!`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert("Certificate link copied to clipboard!");
    }
  };

  if (loading) {
    return <div className="loading">Loading certificate...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!certificate) {
    return <div className="error">Certificate not found</div>;
  }

  return (
    <div className="certificate-page">
      <div className="certificate-actions no-print">
        <button onClick={downloadCertificate} className="btn-download">
          📄 Download PDF
        </button>
        <button onClick={shareCertificate} className="btn-share">
          🔗 Share Certificate
        </button>
      </div>

      <div className="certificate-container">
        <div className="certificate">
          <div className="certificate-border">
            <div className="certificate-content">
              <div className="certificate-header">
                <div className="logo-section">
                  <div className="logo">🎓</div>
                  <h1>Certificate of Completion</h1>
                </div>
              </div>

              <div className="certificate-body">
                <div className="certificate-text">
                  <p className="intro-text">This is to certify that</p>

                  <h2 className="student-name">{certificate.studentName}</h2>

                  <p className="course-text">
                    has successfully completed the course
                  </p>

                  <h3 className="course-name">{certificate.courseName}</h3>

                  <div className="completion-details">
                    <div className="detail-row">
                      <span className="label">Instructor:</span>
                      <span className="value">
                        {certificate.instructorName}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Final Score:</span>
                      <span className="value">{certificate.finalScore}%</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Course Progress:</span>
                      <span className="value">
                        {certificate.courseProgress}%
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Completion Date:</span>
                      <span className="value">
                        {new Date(
                          certificate.completionDate
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="certificate-seal">
                  <div className="seal">
                    <div className="seal-inner">
                      <div className="seal-text">
                        <div>CERTIFIED</div>
                        <div>COMPLETION</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="certificate-footer">
                <div className="signature-section">
                  <div className="signature">
                    <div className="signature-line"></div>
                    <p>Instructor Signature</p>
                  </div>

                  <div className="certificate-info">
                    <div className="certificate-id">
                      Certificate ID: {certificate.certificateId}
                    </div>
                    <div className="verification-code">
                      Verification Code: {certificate.verificationCode}
                    </div>
                  </div>
                </div>

                <div className="issued-by">
                  <p>Issued by Learning Management System</p>
                  <p className="date">
                    Date of Issue:{" "}
                    {new Date(certificate.completionDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="certificate-verification no-print">
        <div className="verification-info">
          <h3>Certificate Verification</h3>
          <p>
            This certificate can be verified using the following information:
          </p>
          <div className="verification-details">
            <div>
              <strong>Certificate ID:</strong> {certificate.certificateId}
            </div>
            <div>
              <strong>Verification Code:</strong> {certificate.verificationCode}
            </div>
            <div>
              <strong>Issue Date:</strong>{" "}
              {new Date(certificate.completionDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
