import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const CreationModal = ({
  isOpen,
  title,
  onClose,
  onConfirm,
  placeholder = "Enter name...",
}) => {
  const [name, setName] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim());
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#1e1e1e",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.1)",
          width: "400px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "1.2rem",
            color: "#fff",
            fontWeight: "500",
          }}
        >
          {title}
        </h3>

        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            background: "#111",
            border: "1px solid #333",
            color: "white",
            padding: "10px 12px",
            borderRadius: "6px",
            outline: "none",
            fontSize: "1rem",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "#aaa",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "8px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
              opacity: name.trim() ? 1 : 0.5,
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CreationModal;
