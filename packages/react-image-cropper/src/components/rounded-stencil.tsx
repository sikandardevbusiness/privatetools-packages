import React, { memo } from "react";
import type { PixelCrop, HandlePosition } from "../types";

interface RoundedStencilProps {
    containerWidth: number;
    containerHeight: number;
    crop: PixelCrop;
    borderRadius: number; // 0 to 50
    showGrid: boolean;
    onHandlePointerDown: (e: React.PointerEvent<HTMLDivElement>, handle: HandlePosition) => void;
    activeHandle: HandlePosition | null;
}

/**
 * Builds an SVG path string that covers the outer rectangular container
 * and cuts out a rounded rectangle hole using `fill-rule="evenodd"`.
 */
function createEvenOddMaskPath(
    containerW: number,
    containerH: number,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
): string {
    // Outer boundary
    const outer = `M 0 0 H ${containerW} V ${containerH} H 0 Z`;

    // Inner cutout
    if (r <= 0) {
        return `${outer} M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
    }

    const inner = [
        `M ${x + r} ${y}`,
        `H ${x + w - r}`,
        `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,
        `V ${y + h - r}`,
        `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
        `H ${x + r}`,
        `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
        `V ${y + r}`,
        `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
        "Z",
    ].join(" ");

    return `${outer} ${inner}`;
}

const HANDLES: Array<{ id: HandlePosition; cursor: string }> = [
    { id: "nw", cursor: "nwse-resize" },
    { id: "n", cursor: "ns-resize" },
    { id: "ne", cursor: "nesw-resize" },
    { id: "e", cursor: "ew-resize" },
    { id: "se", cursor: "nwse-resize" },
    { id: "s", cursor: "ns-resize" },
    { id: "sw", cursor: "nesw-resize" },
    { id: "w", cursor: "ew-resize" },
];

export const RoundedStencil: React.FC<RoundedStencilProps> = memo(
    ({ containerWidth, containerHeight, crop, borderRadius, showGrid, onHandlePointerDown }) => {
        if (containerWidth <= 0 || containerHeight <= 0 || crop.width <= 0 || crop.height <= 0) {
            return null;
        }

        const clampedRadiusPct = Math.max(0, Math.min(50, borderRadius));
        const maxPixelRadius = Math.min(crop.width, crop.height) / 2;
        const pixelRadius = Math.min(
            maxPixelRadius,
            Math.min(crop.width, crop.height) * (clampedRadiusPct / 100),
        );

        const maskPath = createEvenOddMaskPath(
            containerWidth,
            containerHeight,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            pixelRadius,
        );

        // Coordinate mapping for the 8 resize handles
        const getHandleCoords = (pos: HandlePosition) => {
            switch (pos) {
                case "nw":
                    return { left: crop.x, top: crop.y };
                case "n":
                    return { left: crop.x + crop.width / 2, top: crop.y };
                case "ne":
                    return { left: crop.x + crop.width, top: crop.y };
                case "e":
                    return { left: crop.x + crop.width, top: crop.y + crop.height / 2 };
                case "se":
                    return { left: crop.x + crop.width, top: crop.y + crop.height };
                case "s":
                    return { left: crop.x + crop.width / 2, top: crop.y + crop.height };
                case "sw":
                    return { left: crop.x, top: crop.y + crop.height };
                case "w":
                    return { left: crop.x, top: crop.y + crop.height / 2 };
            }
        };

        return (
            <>
                {/* 1. EvenOdd SVG Mask for dimming outside area */}
                <svg
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        zIndex: 10,
                    }}
                    viewBox={`0 0 ${containerWidth} ${containerHeight}`}
                >
                    <path d={maskPath} fill="rgba(0, 0, 0, 0.62)" fillRule="evenodd" />
                </svg>

                {/* 2. Stencil Outline Div & Rule-of-Thirds Grid */}
                <div
                    style={{
                        position: "absolute",
                        left: crop.x,
                        top: crop.y,
                        width: crop.width,
                        height: crop.height,
                        borderRadius: `${pixelRadius}px`,
                        border: "1.5px solid rgba(255, 255, 255, 0.92)",
                        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.35)",
                        pointerEvents: "none",
                        zIndex: 15,
                        boxSizing: "border-box",
                    }}
                >
                    {showGrid && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                clipPath: `inset(0 round ${pixelRadius}px)`,
                                pointerEvents: "none",
                                overflow: "hidden",
                            }}
                        >
                            {/* Vertical grid lines */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: "33.333%",
                                    top: 0,
                                    bottom: 0,
                                    width: 1,
                                    backgroundColor: "rgba(255, 255, 255, 0.45)",
                                    boxShadow: "0 0 2px rgba(0, 0, 0, 0.6)",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: "66.666%",
                                    top: 0,
                                    bottom: 0,
                                    width: 1,
                                    backgroundColor: "rgba(255, 255, 255, 0.45)",
                                    boxShadow: "0 0 2px rgba(0, 0, 0, 0.6)",
                                }}
                            />
                            {/* Horizontal grid lines */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: "33.333%",
                                    left: 0,
                                    right: 0,
                                    height: 1,
                                    backgroundColor: "rgba(255, 255, 255, 0.45)",
                                    boxShadow: "0 0 2px rgba(0, 0, 0, 0.6)",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    top: "66.666%",
                                    left: 0,
                                    right: 0,
                                    height: 1,
                                    backgroundColor: "rgba(255, 255, 255, 0.45)",
                                    boxShadow: "0 0 2px rgba(0, 0, 0, 0.6)",
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* 3. Draggable Handles (Siblings to avoid being clipped by border-radius) */}
                {HANDLES.map(({ id, cursor }) => {
                    const { left, top } = getHandleCoords(id);
                    const isCorner = id === "nw" || id === "ne" || id === "se" || id === "sw";

                    return (
                        <div
                            key={id}
                            onPointerDown={(e) => onHandlePointerDown(e, id)}
                            style={{
                                position: "absolute",
                                left,
                                top,
                                width: 32,
                                height: 32,
                                transform: "translate(-50%, -50%)",
                                cursor,
                                zIndex: 20,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                touchAction: "none",
                            }}
                        >
                            {isCorner ? (
                                // Corner bracket aesthetic
                                <div
                                    style={{
                                        width: 14,
                                        height: 14,
                                        boxSizing: "border-box",
                                        borderColor: "#ffffff",
                                        borderStyle: "solid",
                                        borderWidth: 0,
                                        filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8))",
                                        ...(id === "nw" && {
                                            borderTopWidth: 3,
                                            borderLeftWidth: 3,
                                        }),
                                        ...(id === "ne" && {
                                            borderTopWidth: 3,
                                            borderRightWidth: 3,
                                        }),
                                        ...(id === "se" && {
                                            borderBottomWidth: 3,
                                            borderRightWidth: 3,
                                        }),
                                        ...(id === "sw" && {
                                            borderBottomWidth: 3,
                                            borderLeftWidth: 3,
                                        }),
                                    }}
                                />
                            ) : (
                                // Edge pill handle
                                <div
                                    style={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: 2,
                                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.75)",
                                        ...(id === "n" || id === "s"
                                            ? { width: 16, height: 3 }
                                            : { width: 3, height: 16 }),
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </>
        );
    },
);

RoundedStencil.displayName = "RoundedStencil";
