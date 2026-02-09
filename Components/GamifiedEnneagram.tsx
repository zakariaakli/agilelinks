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
      {/* Summary Card */}
      <div
        style={{
          background: "#302C28",
          borderRadius: "0.75rem",
          padding: "2rem",
          color: "#FAF9F7",
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
            background: "rgba(255,255,255,0.08)",
            borderRadius: "0.5rem",
            padding: "1.5rem",
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

      {/* Detailed Personality Sections */}
      {(enneagramResult.coreMotivation || enneagramResult.keyStrengths || enneagramResult.growthAreas || enneagramResult.blindSpots) && (
        <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>

          {/* Core Motivation */}
          {enneagramResult.coreMotivation && (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                border: "1px solid #E8E4DF",
                borderLeft: "3px solid #9C4B20",
              }}
            >
              <h4
                style={{
                  margin: "0 0 0.75rem 0",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#9C4B20",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                Core Motivation
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9375rem",
                  lineHeight: "1.6",
                  color: "#57524D",
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
                background: "#ffffff",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                border: "1px solid #E8E4DF",
                borderLeft: "3px solid #3D7A4A",
              }}
            >
              <h4
                style={{
                  margin: "0 0 0.75rem 0",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#3D7A4A",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                Key Strengths
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.25rem",
                  fontSize: "0.9375rem",
                  lineHeight: "1.8",
                  color: "#57524D",
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
                background: "#ffffff",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                border: "1px solid #E8E4DF",
                borderLeft: "3px solid #C68B2C",
              }}
            >
              <h4
                style={{
                  margin: "0 0 0.75rem 0",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#C68B2C",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                Growth Areas
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.25rem",
                  fontSize: "0.9375rem",
                  lineHeight: "1.8",
                  color: "#57524D",
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
                background: "#ffffff",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                border: "1px solid #E8E4DF",
                borderLeft: "3px solid #B84A42",
              }}
            >
              <h4
                style={{
                  margin: "0 0 0.75rem 0",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#B84A42",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                Blind Spots
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.25rem",
                  fontSize: "0.9375rem",
                  lineHeight: "1.8",
                  color: "#57524D",
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
