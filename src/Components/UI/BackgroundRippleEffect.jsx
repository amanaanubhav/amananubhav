"use client";
import React, { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Spotlight } from "../UI/SpotlightNew";

export const BackgroundRippleEffect = ({
    rows = 8,
    cols = 27,
    cellSize = 56,
}) => {
    const [clickedCell, setClickedCell] = useState(null);
    const [rippleKey, setRippleKey] = useState(0);
    const ref = useRef(null);

    return (
        <div
            ref={ref}
            className={cn(
                "absolute inset-0 h-full w-full",
                // Light Mode Variables - High Contrast for White Background
                "[--cell-border-color:rgba(0,0,0,0.15)] [--cell-fill-color:rgba(14,165,233,0.1)] [--cell-shadow-color:#a3a3a3]",
                "[--spotlight-1:radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(210,100%,50%,0.25)_0,hsla(210,100%,45%,0.15)_50%,hsla(210,100%,40%,0)_80%)]",
                "[--spotlight-2:radial-gradient(50%_50%_at_50%_50%,hsla(210,100%,50%,0.20)_0,hsla(210,100%,45%,0.10)_80%,transparent_100%)]",
                "[--spotlight-3:radial-gradient(50%_50%_at_50%_50%,hsla(210,100%,50%,0.15)_0,hsla(210,100%,40%,0.08)_80%,transparent_100%)]",

                // Dark Mode Variables - Enhanced Visibility
                "dark:[--cell-border-color:#3f3f46] dark:[--cell-fill-color:rgba(56,189,248,0.03)] dark:[--cell-shadow-color:#171717]",
                "dark:[--spotlight-1:radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(210,100%,85%,0.15)_0,hsla(210,100%,55%,0.05)_50%,hsla(210,100%,45%,0)_80%)]",
                "dark:[--spotlight-2:radial-gradient(50%_50%_at_50%_50%,hsla(210,100%,85%,0.12)_0,hsla(210,100%,55%,0.05)_80%,transparent_100%)]",
                "dark:[--spotlight-3:radial-gradient(50%_50%_at_50%_50%,hsla(210,100%,85%,0.08)_0,hsla(210,100%,45%,0.04)_80%,transparent_100%)]",
            )}
        >
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" />
            <div className="relative h-auto w-auto overflow-hidden">
                <div className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-hidden" />
                <DivGrid
                    key={`base-${rippleKey}`}
                    className="mask-radial-from-20% mask-radial-at-top opacity-600"
                    rows={rows}
                    cols={cols}
                    cellSize={cellSize}
                    borderColor="var(--cell-border-color)"
                    fillColor="var(--cell-fill-color)"
                    clickedCell={clickedCell}
                    onCellClick={(row, col) => {
                        setClickedCell({ row, col });
                        setRippleKey((k) => k + 1);
                    }}
                    interactive
                />
            </div>
        </div>
    );
};

const DivGrid = ({
    className,
    rows = 7,
    cols = 30,
    cellSize = 56,
    borderColor = "#3f3f46",
    fillColor = "rgba(14,165,233,0.3)",
    clickedCell = null,
    onCellClick = () => { },
    interactive = true,
}) => {
    const cells = useMemo(
        () => Array.from({ length: rows * cols }, (_, idx) => idx),
        [rows, cols],
    );

    const gridStyle = {
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        width: cols * cellSize,
        height: rows * cellSize,
        marginInline: "auto",
    };

    return (
        <div className={cn("relative z-[3]", className)} style={gridStyle}>
            {cells.map((idx) => {
                const rowIdx = Math.floor(idx / cols);
                const colIdx = idx % cols;
                const distance = clickedCell
                    ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
                    : 0;
                const delay = clickedCell ? Math.max(0, distance * 55) : 0; // ms
                const duration = 200 + distance * 80; // ms

                const style = clickedCell
                    ? {
                        "--delay": `${delay}ms`,
                        "--duration": `${duration}ms`,
                    }
                    : {};

                return (
                    <div
                        key={idx}
                        className={cn(
                            "cell relative border-[0.5px] opacity-40 transition-opacity duration-150 will-change-transform hover:opacity-80 dark:shadow-[0px_0px_40px_1px_var(--cell-shadow-color)_inset]",
                            clickedCell && "animate-cell-ripple [animation-fill-mode:none]",
                            !interactive && "pointer-events-none",
                        )}
                        style={{
                            backgroundColor: fillColor,
                            borderColor: borderColor,
                            ...style,
                        }}
                        onClick={
                            interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined
                        }
                    />
                );
            })}
        </div>
    );
};
