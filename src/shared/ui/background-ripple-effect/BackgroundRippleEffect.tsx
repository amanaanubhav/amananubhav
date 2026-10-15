"use client";
import { memo, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Spotlight } from "../spotlight";
import { DivGrid, type GridCell } from "./DivGrid";

export interface BackgroundRippleEffectProps {
    rows?: number;
    cols?: number;
    cellSize?: number;
}

const BackgroundRippleEffectImpl = ({
    rows = 8,
    cols = 27,
    cellSize = 56,
}: BackgroundRippleEffectProps) => {
    const [clickedCell, setClickedCell] = useState<GridCell | null>(null);
    const [rippleKey, setRippleKey] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

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

export const BackgroundRippleEffect = memo(BackgroundRippleEffectImpl);
BackgroundRippleEffect.displayName = "BackgroundRippleEffect";
