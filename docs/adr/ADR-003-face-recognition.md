# ADR-003: Face Recognition

## Status
Accepted

## Date
2026-07-11

## Context
A key requirement for preventing buddy punching is biometric validation. We must confirm the identity of the person making a punch log without storing plain biometric photos (due to compliance and storage constraints).

## Decision
We implement a hybrid face recognition model:
- **Client Side (Kiosk):** Use browser CDN models (InsightFace/face-api.js) to scan facial landmarks, confirm alignment, and generate a 128-dimensional floating point representation (embedding vector).
- **Server Side (API):** The client sends the embedding vector with the check-in request. The server compares the embedding vector against enrolled templates for the organization using **Cosine Similarity**.
- **Threshold Check:** The punch is validated only if the cosine similarity meets or exceeds the tenant's threshold configuration (default 0.6).

## Consequences
- **Pros:** Fast, private (no plain face images stored for recognition), runs efficiently on tablets/mobile browsers.
- **Cons:** Dependent on client webcam quality and lighting conditions; require retry logic and fallback adjustments for edge cases.
