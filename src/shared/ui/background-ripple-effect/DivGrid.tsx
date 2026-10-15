"use client";
import { useMemo, type CSSProperties } from "react";
import { cn } from "@/shared/lib/cn";
import type { CSSVars } from "@/shared/lib/css";

export interface GridCell {
    row: number;
    col: number;
}

export interface DivGridProps {
    className?: string;
    rows?: number;
    cols?: number;
    cellSize?: number;
    borderColor?: string;
    fillColor?: string;
    clickedCell?: GridCell | null;
    onCellClick?: (row: number, col: number) => void;
    interactive?: boolean;
}

export const DivGrid = ({
    className,
    rows = 7,
    cols = 30,
    cellSize = 56,
    borderColor = "#3f3f46",
    fillColor = "rgba(14,165,233,0.3)",
    clickedCell = null,
    onCellClick = () => { },
    interactive = true,
}: DivGridProps) => {
    const cells = useMemo(
        () => Array.from({ length: rows * cols }, (_, idx) => idx),
        [rows, cols],
    );

    const gridStyle: CSSProperties = {
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

                const style: CSSVars = clickedCell
                    ? {
                        "--delay": `${delay}ms`,
                        "--duration": `${duration}ms`,
                    }
                    : {};

                const cellStyle: CSSVars = {
                    backgroundColor: fillColor,
                    borderColor: borderColor,
                    ...style,
                };

                return (
                    <div
                        key={idx}
                        className={cn(
                            "cell relative border-[0.5px] opacity-40 transition-opacity duration-150 will-change-transform hover:opacity-80 dark:shadow-[0px_0px_40px_1px_var(--cell-shadow-color)_inset]",
                            clickedCell && "animate-cell-ripple [animation-fill-mode:none]",
                            !interactive && "pointer-events-none",
                        )}
                        style={cellStyle}
                        onClick={
                            interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined
                        }
                    />
                );
            })}
        </div>
    );
};
