import React, { forwardRef, useImperativeHandle, useCallback } from "react";

import type { CropperProps, CropperRef } from "../types";
import { useCropper } from "../hooks/use-cropper";
import { RoundedStencil } from "../components/rounded-stencil";
import { getCroppedCanvas, canvasToBlob, canvasToDataURL } from "../export";

export const Cropper = forwardRef<CropperRef, CropperProps>(
    (
        {
            src,
            aspectRatio,
            borderRadius = 0,
            showGrid = true,
            outputFormat = "png",
            minCropSize = 40,
            minZoom = 1.0,
            maxZoom = 5.0,
            onCropChange,
            className,
            style,
            disabled = false,
        },
        ref,
    ) => {
        const {
            containerRef,
            imageRef,
            containerSize,
            naturalSize,
            cropBox,
            imageTransform,
            isInteracting,
            activeHandle,
            handleImageLoad,
            handleWheel,
            handlePointerDown,
            reset,
            setZoom,
        } = useCropper({
            aspectRatio,
            minCropSize,
            minZoom,
            maxZoom,
            onCropChange,
            disabled,
        });

        // Expose imperative API for canvas export and control
        useImperativeHandle(
            ref,
            (): CropperRef => ({
                getCroppedCanvas: () => {
                    if (!imageRef.current || naturalSize.width === 0 || cropBox.width === 0) {
                        return null;
                    }
                    const scale = naturalSize.width / imageTransform.width;
                    const naturalCrop = {
                        x: Math.max(0, Math.round((cropBox.x - imageTransform.x) * scale)),
                        y: Math.max(0, Math.round((cropBox.y - imageTransform.y) * scale)),
                        width: Math.min(naturalSize.width, Math.round(cropBox.width * scale)),
                        height: Math.min(naturalSize.height, Math.round(cropBox.height * scale)),
                    };
                    return getCroppedCanvas(
                        imageRef.current,
                        naturalCrop,
                        borderRadius,
                        outputFormat,
                    );
                },
                getCroppedBlob: async (quality = 0.92) => {
                    const canvas =
                        ref && "current" in ref && ref.current
                            ? ref.current.getCroppedCanvas()
                            : null;
                    if (!canvas) return null;
                    return canvasToBlob(canvas, outputFormat, quality);
                },
                getCroppedDataURL: (quality = 0.92) => {
                    const canvas =
                        ref && "current" in ref && ref.current
                            ? ref.current.getCroppedCanvas()
                            : null;
                    if (!canvas) return null;
                    return canvasToDataURL(canvas, outputFormat, quality);
                },
                reset,
                getZoom: () => imageTransform.zoom,
                setZoom,
            }),
            [
                borderRadius,
                cropBox,
                imageTransform,
                naturalSize,
                outputFormat,
                reset,
                setZoom,
                ref,
                imageRef,
            ],
        );

        const onImageAreaPointerDown = useCallback(
            (e: React.PointerEvent<HTMLDivElement>) => {
                handlePointerDown(e);
            },
            [handlePointerDown],
        );

        return (
            <div
                ref={containerRef}
                className={className}
                onWheel={handleWheel}
                onPointerDown={onImageAreaPointerDown}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minHeight: 300,
                    backgroundColor: "#0f1115",
                    overflow: "hidden",
                    userSelect: "none",
                    touchAction: "none",
                    cursor: isInteracting && !activeHandle ? "grabbing" : "grab",
                    ...style,
                }}
            >
                {/* Natural image element */}
                <img
                    ref={imageRef}
                    src={src}
                    alt="Cropper Source"
                    crossOrigin="anonymous"
                    onLoad={handleImageLoad}
                    draggable={false}
                    style={{
                        position: "absolute",
                        left: imageTransform.x,
                        top: imageTransform.y,
                        width: imageTransform.width,
                        height: imageTransform.height,
                        maxWidth: "none",
                        maxHeight: "none",
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                />

                {/* SVG dimming mask, rounded stencil outline, grid lines, and 8 handles */}
                <RoundedStencil
                    containerWidth={containerSize.width}
                    containerHeight={containerSize.height}
                    crop={cropBox}
                    borderRadius={borderRadius}
                    showGrid={showGrid}
                    activeHandle={activeHandle}
                    onHandlePointerDown={handlePointerDown}
                />
            </div>
        );
    },
);

Cropper.displayName = "Cropper";
