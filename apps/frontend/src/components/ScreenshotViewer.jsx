// ScreenshotViewer.jsx
// Component to display before/after screenshots in the node configuration panel

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { logger } from "../utils/logger";
import screenshotManager from "../utils/ScreenshotManager";
import "./styles/ScreenshotViewer.css";

/**
 * ScreenshotViewer Component
 *
 * @param {Object} props
 * @param {Object} props.screenshots - Screenshot metadata { before: {...}, after: {...} }
 * @param {string} props.nodeId - Node ID for loading screenshots
 * @param {boolean} props.isVisible - Whether the panel is visible (for lazy loading)
 */
function ScreenshotViewer({ screenshots, nodeId, isVisible = true }) {
  const { t, i18n } = useTranslation();
  const [loadedImages, setLoadedImages] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  console.log("📸 ScreenshotViewer props:", { nodeId, isVisible, screenshots });

  // Load screenshots when panel becomes visible
  useEffect(() => {
    if (!isVisible || !screenshots) {
      return;
    }

    async function loadImages() {
      setLoading(true);
      const loaded = {};

      try {
        if (screenshots.after) {
          const url = await screenshotManager.loadScreenshot(nodeId, "after");
          if (url) {
            loaded.after = {
              ...screenshots.after,
              url,
            };
          }
        }

        setLoadedImages(loaded);
      } catch (error) {
        logger.error("Failed to load screenshots", error, "ScreenshotViewer");
      } finally {
        setLoading(false);
      }
    }

    loadImages();
  }, [isVisible, nodeId, screenshots]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="screenshot-section">
        <h3 className="screenshot-title">📸 {t("screenshots.title")}</h3>
        <div className="screenshot-loading">{t("screenshots.loading")}</div>
      </div>
    );
  }

  const handleImageClick = (image, timing) => {
    setSelectedImage({ ...image, timing });
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString(
      i18n.language === "es" ? "es-ES" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      },
    );
  };

  return (
    <>
      <div className="screenshot-section">
        <h3 className="screenshot-title">📸 {t("screenshots.title")}</h3>

        <div className="screenshot-container">
          {loadedImages.after ? (
            <div className="screenshot-item single-view">
              <img
                src={loadedImages.after.url}
                alt={t("screenshots.alt_text")}
                className="screenshot-image"
                loading="lazy"
                onClick={() => handleImageClick(loadedImages.after, "after")}
              />
              <div className="screenshot-meta">
                {formatTime(loadedImages.after.timestamp)}
                {" • "}
                {formatSize(loadedImages.after.size)}
              </div>
            </div>
          ) : (
            <div className="screenshot-placeholder">
              <div className="placeholder-icon">📸</div>
              <div className="placeholder-text">
                {t("screenshots.no_captures")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-size image modal */}
      {selectedImage && (
        <div className="screenshot-modal" onClick={closeModal}>
          <div
            className="screenshot-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="screenshot-modal-close" onClick={closeModal}>
              ✕
            </button>
            <div className="screenshot-modal-header">
              {t("screenshots.title")}{" "}
              {selectedImage.timing === "before"
                ? t("screenshots.before")
                : t("screenshots.after")}
            </div>
            <img
              src={selectedImage.url}
              alt={`${t("screenshots.title")} ${selectedImage.timing}`}
              className="screenshot-modal-image"
            />
            <div className="screenshot-modal-footer">
              {formatTime(selectedImage.timestamp)} •{" "}
              {formatSize(selectedImage.size)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ScreenshotViewer;
