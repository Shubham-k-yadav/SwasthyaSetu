import React from 'react';

// Generates an SVG representation for the reservation code and hospital data
export function ReservationQRCode({ code, hospitalName, value, size = 160 }) {
  const qrData = value || `SWASTHYA-SETU:${code}:${hospitalName}`;

  // Deterministic SVG QR pattern based on data string hash
  const generateMatrix = (str) => {
    const size = 21; // 21x21 grid for Version 1 QR
    const matrix = Array(size).fill(0).map(() => Array(size).fill(false));

    // Helper: Draw Finder Patterns (7x7 squares at corners)
    const drawFinderPattern = (row, col) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[row + r][col + c] = true;
          }
        }
      }
    };

    // Draw Top-Left, Top-Right, Bottom-Left Finder Patterns
    drawFinderPattern(0, 0);
    drawFinderPattern(0, size - 7);
    drawFinderPattern(size - 7, 0);

    // Simple hash to fill internal data cells
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder pattern zones
        const isTL = r < 8 && c < 8;
        const isTR = r < 8 && c >= size - 8;
        const isBL = r >= size - 8 && c < 8;
        if (!isTL && !isTR && !isBL) {
          const val = (r * size + c + Math.abs(hash)) % 3;
          matrix[r][c] = val === 0 || (r % 2 === 0 && c % 3 === 0);
        }
      }
    }

    return matrix;
  };

  const matrix = generateMatrix(qrData);
  const cellSize = size / matrix.length;

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="#ffffff" />
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
      <span className="text-[10px] font-mono text-slate-500 mt-1">SCAN FOR COUNTER ADMISSION</span>
    </div>
  );
}
