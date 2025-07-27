import React, { useEffect, useRef, useState } from "react";

export default function ScratchCard({
  width = 240,
  height = 120,
  prize,
  onReveal, // callback when user scratches >60%
  children,
}) {
  const canvasRef = useRef(null);
  const [scratched, setScratched] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let isDragging = false;

    // Reset
    canvas.width = width;
    canvas.height = height;

    // Silver/gradient cover
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#b0b4b7");
    gradient.addColorStop(1, "#e2e2e2");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw overlay text (optional)
    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "rgba(80,80,80,0.5)";
    ctx.textAlign = "center";
    ctx.fillText("Scratch Here", width / 2, height / 2 + 8);

    function scratch(x, y) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, 2 * Math.PI);
      ctx.fill();
    }

    function getXY(evt) {
      const rect = canvas.getBoundingClientRect();
      if (evt.touches && evt.touches.length) {
        evt = evt.touches[0];
      }
      return {
        x: (evt.clientX - rect.left) * (canvas.width / rect.width),
        y: (evt.clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    const handleDown = (e) => {
      isDragging = true;
      const { x, y } = getXY(e);
      scratch(x, y);
    };
    const handleMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const { x, y } = getXY(e);
      scratch(x, y);
    };
    const handleUp = () => {
      isDragging = false;
      checkPercent();
    };
    const handleLeave = () => {
      isDragging = false;
    };

    // Scratch completion check (60%+ scratched)
    function checkPercent() {
      const imgData = ctx.getImageData(0, 0, width, height);
      let cleared = 0;
      for (let i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i + 3] === 0) cleared++;
      }
      if (!scratched && cleared / (width * height) > 0.6) {
        setScratched(true);
        if (onReveal) onReveal();
      }
    }

    const isTouch = "ontouchstart" in window;

    // Attach events
    if (isTouch) {
      canvas.addEventListener("touchstart", handleDown);
      canvas.addEventListener("touchmove", handleMove);
      canvas.addEventListener("touchend", handleUp);
    } else {
      canvas.addEventListener("mousedown", handleDown);
      canvas.addEventListener("mousemove", handleMove);
      canvas.addEventListener("mouseup", handleUp);
      canvas.addEventListener("mouseleave", handleLeave);
    }

    return () => {
      if (isTouch) {
        canvas.removeEventListener("touchstart", handleDown);
        canvas.removeEventListener("touchmove", handleMove);
        canvas.removeEventListener("touchend", handleUp);
      } else {
        canvas.removeEventListener("mousedown", handleDown);
        canvas.removeEventListener("mousemove", handleMove);
        canvas.removeEventListener("mouseup", handleUp);
        canvas.removeEventListener("mouseleave", handleLeave);
      }
    };
    // eslint-disable-next-line
  }, [width, height, scratched, onReveal]);

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        boxShadow: "0 0 12px #0001",
        borderRadius: 12,
        background: "#282828",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 0,
          color: "#36d399",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 1,
          pointerEvents: "none",
          borderRadius: 12,
          background: "#18181b",
        }}
      >
        {children || prize}
      </div>
      {!scratched && (
        <canvas
          ref={canvasRef}
          style={{
            width,
            height,
            display: "block",
            borderRadius: 12,
            cursor:
              'url("https://media.geeksforgeeks.org/wp-content/uploads/20231030101751/bx-eraser-icon.png"), auto',
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
}
