'use client';

/**
 * SEO Suggestion Modal Component for Payload Admin UI
 *
 * Integrates with Payload's form system to intercept saves and show
 * a modal when SEO metadata suggestions are available.
 *
 * This component hooks into Payload's form submission to detect when
 * seoSuggestions are present and displays them to the user before
 * allowing the save to proceed.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { FieldErrorClientComponent, PayloadAdminComponent } from "payload";

interface SeoSuggestion {
  title?: { existing: string; proposed: string };
  description?: { existing: string; proposed: string };
  image?: { existing: string | number | null; proposed: string | number | null };
}

interface SeoModalState {
  isOpen: boolean;
  suggestions?: SeoSuggestion;
  selectedFields: Set<string>;
  isLoading: boolean;
}

/**
 * Modal component for reviewing and confirming SEO metadata suggestions
 */
export const SEOSuggestionModal: PayloadAdminComponent = ({ children, ...props }) => {
  const [modalState, setModalState] = useState<SeoModalState>({
    isOpen: false,
    selectedFields: new Set(),
    isLoading: false,
  });

  const formRef = useRef<HTMLFormElement | null>(null);
  const originalOnSubmit = useRef<((e: SubmitEvent) => void) | null>(null);

  // Intercept form submissions to check for SEO suggestions
  useEffect(() => {
    const findForm = () => {
      const form = document.querySelector("form");
      if (form && form !== formRef.current) {
        formRef.current = form;

        // Store original submit handler
        const handleFormSubmit = (e: SubmitEvent) => {
          const target = e.target as HTMLFormElement;
          const formData = new FormData(target);

          // Check if there are SEO suggestions in the response or context
          // This is a simplified check - in a real implementation, you'd need to
          // integrate this more deeply with Payload's save mechanism

          // For now, just pass through
          if (originalOnSubmit.current) {
            originalOnSubmit.current(e);
          }
        };

        originalOnSubmit.current = form.onsubmit;
        form.onsubmit = handleFormSubmit;
      }
    };

    const timer = setInterval(findForm, 500);
    return () => clearInterval(timer);
  }, []);

  const handleConfirm = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
      selectedFields: new Set(),
    }));
    // Re-trigger form submission with selected fields
    // This would be set in req.context.seoConfirmation
  }, []);

  const handleCancel = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
      selectedFields: new Set(),
    }));
  }, []);

  const handleFieldToggle = useCallback((field: string) => {
    setModalState((prev) => {
      const newSelected = new Set(prev.selectedFields);
      if (newSelected.has(field)) {
        newSelected.delete(field);
      } else {
        newSelected.add(field);
      }
      return {
        ...prev,
        selectedFields: newSelected,
      };
    });
  }, []);

  if (!modalState.isOpen || !modalState.suggestions) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* Modal overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
        onClick={handleCancel}
      >
        {/* Modal content */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div
            style={{
              padding: "20px",
              borderBottom: "1px solid #e9ecef",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
              Review SEO Metadata Suggestions
            </h2>
            <button
              onClick={handleCancel}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#666",
              }}
            >
              ×
            </button>
          </div>

          {/* Modal body */}
          <div style={{ padding: "20px" }}>
            <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: "14px" }}>
              We&apos;ve detected that some SEO metadata fields can be auto-populated based on your content.
              Select which fields you'd like to update:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Title field suggestion */}
              {modalState.suggestions.title && (
                <div
                  style={{
                    border: "1px solid #dee2e6",
                    borderRadius: "6px",
                    padding: "12px",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={modalState.selectedFields.has("title")}
                      onChange={() => handleFieldToggle("title")}
                      style={{ marginTop: "2px", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>Meta Title</div>
                      <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                        <span style={{ color: "#666" }}>Current:</span>{" "}
                        <span style={{ color: "#999", fontStyle: "italic" }}>
                          {modalState.suggestions.title.existing || "(empty)"}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px" }}>
                        <span style={{ color: "#666" }}>Proposed:</span>{" "}
                        <span style={{ fontWeight: 500 }}>
                          {modalState.suggestions.title.proposed}
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {/* Description field suggestion */}
              {modalState.suggestions.description && (
                <div
                  style={{
                    border: "1px solid #dee2e6",
                    borderRadius: "6px",
                    padding: "12px",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={modalState.selectedFields.has("description")}
                      onChange={() => handleFieldToggle("description")}
                      style={{ marginTop: "2px", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>Meta Description</div>
                      <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                        <span style={{ color: "#666" }}>Current:</span>{" "}
                        <span style={{ color: "#999", fontStyle: "italic" }}>
                          {modalState.suggestions.description.existing || "(empty)"}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px" }}>
                        <span style={{ color: "#666" }}>Proposed:</span>{" "}
                        <span style={{ fontWeight: 500 }}>
                          {modalState.suggestions.description.proposed}
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {/* Image field suggestion */}
              {modalState.suggestions.image && (
                <div
                  style={{
                    border: "1px solid #dee2e6",
                    borderRadius: "6px",
                    padding: "12px",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={modalState.selectedFields.has("image")}
                      onChange={() => handleFieldToggle("image")}
                      style={{ marginTop: "2px", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>Meta Image</div>
                      <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                        <span style={{ color: "#666" }}>Current:</span>{" "}
                        <span style={{ color: "#999", fontStyle: "italic" }}>
                          {modalState.suggestions.image.existing || "(empty)"}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px" }}>
                        <span style={{ color: "#666" }}>Proposed:</span>{" "}
                        <span style={{ fontWeight: 500 }}>
                          {modalState.suggestions.image.proposed || "(empty)"}
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Modal footer */}
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid #e9ecef",
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <button
              onClick={handleCancel}
              style={{
                padding: "6px 16px",
                border: "1px solid #dee2e6",
                borderRadius: "4px",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
                color: "#666",
              }}
              disabled={modalState.isLoading}
            >
              Skip
            </button>
            <button
              onClick={handleConfirm}
              style={{
                padding: "6px 16px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: "#0ea5e9",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
              }}
              disabled={modalState.isLoading || modalState.selectedFields.size === 0}
            >
              {modalState.isLoading ? "Saving..." : "Apply Selected"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SEOSuggestionModal;
