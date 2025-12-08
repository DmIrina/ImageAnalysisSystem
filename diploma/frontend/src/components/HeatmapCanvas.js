import React, {useRef, useEffect} from "react";

export default function HeatmapCanvas({data, width = 256, height = 256}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const rows = data.length;
        const cols = data[0].length;

        const cellW = width / cols;
        const cellH = height / rows;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const v = data[y][x]; // значення 0..1

                // Градієнт: синій → червоний
                const r = Math.round(v * 255);
                const b = Math.round((1 - v) * 255);
                const g = 20;

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
            }
        }
    }, [data, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{borderRadius: 8, border: "1px solid #ddd"}}
        />
    );
}
