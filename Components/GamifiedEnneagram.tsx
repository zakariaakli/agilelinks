import React from "react";
import { ZapIcon } from "./Icons";
import { EnneagramResult } from "../Models/EnneagramResult";

interface GamifiedEnneagramProps {
  enneagramResult: EnneagramResult;
  className?: string;
}

const GamifiedEnneagram: React.FC<GamifiedEnneagramProps> = ({
  enneagramResult,
  className = "",
}) => {

  return (
    <div className={`gamified-enneagram ${className}`}>
      {/* Gamified Summary - Your Personality Insights */}
      <div
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          borderRadius: "1rem",
          padding: "2rem",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 70% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <ZapIcon size={24} />
            <h3
              style={{
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              Your Personality Insights
            </h3>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              backdropFilter: "blur(10px)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "1.125rem",
                lineHeight: "1.6",
                fontWeight: "500",
              }}
            >
              {enneagramResult.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Personality Sections */}
      {(enneagramResult.coreMotivation || enneagramResult.keyStrengths || enneagramResult.growthAreas || enneagramResult.blindSpots) && (
        <div style={{ marginTop: "2rem", display: "grid", gap: "1.5rem" }}>

          {/* Core Motivation */}
          {enneagramResult.coreMotivation && (
            <div
              style={{
                background: "white",
                borderRadius: "1rem",
                padding: "1.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #8b5cf6",
              }}
            >
              <h4
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#8b5cf6",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>💫</span> Core Motivation
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  lineHeight: "1.6",
                  color: "#4b5563",
                }}
              >
                {enneagramResult.coreMotivation}
              </p>
            </div>
          )}

          {/* Key Strengths */}
          {enneagramResult.keyStrengths && enneagramResult.keyStrengths.length > 0 && (
            <div
              style={{
                background: "white",
                borderRadius: "1rem",
                padding: "1.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #10b981",
              }}
            >
              <h4
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>✨</span> Key Strengths
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.5rem",
                  fontSize: "1rem",
                  lineHeight: "1.8",
                  color: "#4b5563",
                }}
              >
                {enneagramResult.keyStrengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Growth Areas */}
          {enneagramResult.growthAreas && enneagramResult.growthAreas.length > 0 && (
            <div
              style={{
                background: "white",
                borderRadius: "1rem",
                padding: "1.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #f59e0b",
              }}
            >
              <h4
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>🌱</span> Growth Areas
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.5rem",
                  fontSize: "1rem",
                  lineHeight: "1.8",
                  color: "#4b5563",
                }}
              >
                {enneagramResult.growthAreas.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Blind Spots */}
          {enneagramResult.blindSpots && enneagramResult.blindSpots.length > 0 && (
            <div
              style={{
                background: "white",
                borderRadius: "1rem",
                padding: "1.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #ef4444",
              }}
            >
              <h4
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>👁️</span> Blind Spots
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.5rem",
                  fontSize: "1rem",
                  lineHeight: "1.8",
                  color: "#4b5563",
                }}
              >
                {enneagramResult.blindSpots.map((spot, index) => (
                  <li key={index}>{spot}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default GamifiedEnneagram;
