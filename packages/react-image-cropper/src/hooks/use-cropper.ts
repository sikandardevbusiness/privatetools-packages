import { useState, useRef, useCallback, useEffect } from "react";
import type React from "react";

import type { CropArea, PixelCrop, ImageTransform, HandlePosition, Dimensions } from "../types";

interface UseCropperParams {
    aspectRatio?: number;
    minCropSize?: number;
    minZoom?: number;
    maxZoom?: number;
    onCropChange?: (crop: CropArea) => void;
    disabled?: boolean;
}

interface DragState {
    type: "pan" | "resize";
    handle?: HandlePosition;
    startX: number;
    startY: number;
    startCrop: PixelCrop;
    startImage: ImageTransform;
}

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

export function useCropper({
    aspectRatio,
    minCropSize = 40,
    minZoom = 1.0,
    maxZoom = 5.0,
    onCropChange,
    disabled = false,
}: UseCropperParams) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    const [containerSize, setContainerSize] = useState<Dimensions>({ width: 0, height: 0 });
    const [naturalSize, setNaturalSize] = useState<Dimensions>({ width: 0, height: 0 });
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);

    const [cropBox, setCropBox] = useState<PixelCrop>({ x: 0, y: 0, width: 0, height: 0 });
    const [imageTransform, setImageTransform] = useState<ImageTransform>({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        zoom: 1.0,
    });

    const [isInteracting, setIsInteracting] = useState<boolean>(false);
    const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null);

    const dragStateRef = useRef<DragState | null>(null);
    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const pinchStartDistRef = useRef<number | null>(null);
    const pinchStartZoomRef = useRef<number>(1.0);

    // ResizeObserver to track container bounding box
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
                setContainerSize({ width, height });
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Compute natural crop coordinates and notify parent
    const notifyCropChange = useCallback(
        (currentCrop: PixelCrop, currentImg: ImageTransform, natSize: Dimensions) => {
            if (natSize.width === 0 || currentImg.width === 0) return;
            const scale = natSize.width / currentImg.width;
            const relX = currentCrop.x - currentImg.x;
            const relY = currentCrop.y - currentImg.y;

            const naturalCrop: CropArea = {
                x: Math.max(0, Math.round(relX * scale)),
                y: Math.max(0, Math.round(relY * scale)),
                width: Math.min(natSize.width, Math.round(currentCrop.width * scale)),
                height: Math.min(natSize.height, Math.round(currentCrop.height * scale)),
            };

            onCropChange?.(naturalCrop);
        },
        [onCropChange],
    );

    // Initialize image and crop positions whenever image or container updates
    const initPositions = useCallback(
        (
            cWidth: number,
            cHeight: number,
            nWidth: number,
            nHeight: number,
            forcedRatio?: number,
        ) => {
            if (cWidth <= 0 || cHeight <= 0 || nWidth <= 0 || nHeight <= 0) return;

            const padding = 32;
            const availW = Math.max(40, cWidth - padding * 2);
            const availH = Math.max(40, cHeight - padding * 2);

            const baseScale = Math.min(availW / nWidth, availH / nHeight);
            const imgW = nWidth * baseScale;
            const imgH = nHeight * baseScale;
            const imgX = (cWidth - imgW) / 2;
            const imgY = (cHeight - imgH) / 2;

            const initialTransform: ImageTransform = {
                x: imgX,
                y: imgY,
                width: imgW,
                height: imgH,
                zoom: 1.0,
            };

            // Set initial stencil to 80% of image dimensions while respecting aspect ratio
            const ratio = forcedRatio ?? aspectRatio;
            let cropW = imgW * 0.8;
            let cropH = imgH * 0.8;

            if (ratio) {
                if (cropW / cropH > ratio) {
                    cropW = cropH * ratio;
                } else {
                    cropH = cropW / ratio;
                }
            }

            const cropX = imgX + (imgW - cropW) / 2;
            const cropY = imgY + (imgH - cropH) / 2;

            const initialCrop: PixelCrop = {
                x: cropX,
                y: cropY,
                width: cropW,
                height: cropH,
            };

            setImageTransform(initialTransform);
            setCropBox(initialCrop);
            notifyCropChange(initialCrop, initialTransform, { width: nWidth, height: nHeight });
        },
        [aspectRatio, notifyCropChange],
    );

    const handleImageLoad = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
            const img = e.currentTarget;
            const nW = img.naturalWidth;
            const nH = img.naturalHeight;
            setNaturalSize({ width: nW, height: nH });
            setImageLoaded(true);

            if (containerSize.width > 0 && containerSize.height > 0) {
                initPositions(containerSize.width, containerSize.height, nW, nH);
            }
        },
        [containerSize, initPositions],
    );

    // Recalculate when container size initializes
    useEffect(() => {
        if (imageLoaded && naturalSize.width > 0 && containerSize.width > 0) {
            initPositions(
                containerSize.width,
                containerSize.height,
                naturalSize.width,
                naturalSize.height,
            );
        }
    }, [
        containerSize.width,
        containerSize.height,
        imageLoaded,
        naturalSize.width,
        naturalSize.height,
        initPositions,
    ]);

    // Adjust crop stencil when aspectRatio prop changes dynamically
    useEffect(() => {
        if (!imageLoaded || !aspectRatio || cropBox.width === 0) return;

        setCropBox((prev) => {
            let newW = prev.width;
            let newH = newW / aspectRatio;

            // Ensure the stencil fits within the displayed image bounds
            if (newH > imageTransform.height) {
                newH = imageTransform.height;
                newW = newH * aspectRatio;
            }
            if (newW > imageTransform.width) {
                newW = imageTransform.width;
                newH = newW / aspectRatio;
            }

            const newX = clamp(
                prev.x,
                imageTransform.x,
                imageTransform.x + imageTransform.width - newW,
            );
            const newY = clamp(
                prev.y,
                imageTransform.y,
                imageTransform.y + imageTransform.height - newH,
            );

            const nextCrop: PixelCrop = { x: newX, y: newY, width: newW, height: newH };
            notifyCropChange(nextCrop, imageTransform, naturalSize);
            return nextCrop;
        });
    }, [aspectRatio, imageLoaded, imageTransform, naturalSize, notifyCropChange]);

    // Restrict image coordinates so the crop box remains completely covered
    const clampImagePosition = useCallback(
        (imgX: number, imgY: number, imgW: number, imgH: number, crop: PixelCrop) => {
            const minX = crop.x + crop.width - imgW;
            const maxX = crop.x;
            const minY = crop.y + crop.height - imgH;
            const maxY = crop.y;

            return {
                x: clamp(imgX, minX, maxX),
                y: clamp(imgY, minY, maxY),
            };
        },
        [],
    );

    // Set zoom centered at a specific anchor point (screen coordinates)
    const applyZoomAtPoint = useCallback(
        (targetZoom: number, anchorX: number, anchorY: number) => {
            if (naturalSize.width === 0 || containerSize.width === 0) return;
            const nextZoom = clamp(targetZoom, minZoom, maxZoom);

            setImageTransform((prev) => {
                const padding = 32;
                const availW = Math.max(40, containerSize.width - padding * 2);
                const availH = Math.max(40, containerSize.height - padding * 2);
                const baseScale = Math.min(availW / naturalSize.width, availH / naturalSize.height);

                const newW = naturalSize.width * baseScale * nextZoom;
                const newH = naturalSize.height * baseScale * nextZoom;

                // Relative offset of anchor point within displayed image
                const relX = (anchorX - prev.x) / prev.width;
                const relY = (anchorY - prev.y) / prev.height;

                let nextX = anchorX - relX * newW;
                let nextY = anchorY - relY * newH;

                // Keep crop box covered
                const clamped = clampImagePosition(nextX, nextY, newW, newH, cropBox);
                nextX = clamped.x;
                nextY = clamped.y;

                const nextTransform: ImageTransform = {
                    x: nextX,
                    y: nextY,
                    width: newW,
                    height: newH,
                    zoom: nextZoom,
                };

                notifyCropChange(cropBox, nextTransform, naturalSize);
                return nextTransform;
            });
        },
        [
            clampImagePosition,
            containerSize,
            cropBox,
            maxZoom,
            minZoom,
            naturalSize,
            notifyCropChange,
        ],
    );

    // Mouse wheel zoom
    const handleWheel = useCallback(
        (e: React.WheelEvent<HTMLDivElement>) => {
            if (disabled) return;
            e.preventDefault();
            e.stopPropagation();

            const rect = containerRef.current?.getBoundingClientRect();
            const cursorX = rect ? e.clientX - rect.left : containerSize.width / 2;
            const cursorY = rect ? e.clientY - rect.top : containerSize.height / 2;

            const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
            applyZoomAtPoint(imageTransform.zoom * factor, cursorX, cursorY);
        },
        [disabled, applyZoomAtPoint, imageTransform.zoom, containerSize],
    );

    // Calculate resized stencil with optional locked aspect ratio
    const calculateResize = useCallback(
        (
            handle: HandlePosition,
            startCrop: PixelCrop,
            dx: number,
            dy: number,
            img: ImageTransform,
        ): PixelCrop => {
            const imgMinX = img.x;
            const imgMaxX = img.x + img.width;
            const imgMinY = img.y;
            const imgMaxY = img.y + img.height;

            const minW = aspectRatio
                ? Math.max(minCropSize, minCropSize * aspectRatio)
                : minCropSize;
            const minH = aspectRatio
                ? Math.max(minCropSize, minCropSize / aspectRatio)
                : minCropSize;

            if (!aspectRatio) {
                let { x, y, width, height } = startCrop;

                switch (handle) {
                    case "e": {
                        width = clamp(startCrop.width + dx, minW, imgMaxX - startCrop.x);
                        break;
                    }
                    case "w": {
                        const nextX = clamp(
                            startCrop.x + dx,
                            imgMinX,
                            startCrop.x + startCrop.width - minW,
                        );
                        width = startCrop.x + startCrop.width - nextX;
                        x = nextX;
                        break;
                    }
                    case "s": {
                        height = clamp(startCrop.height + dy, minH, imgMaxY - startCrop.y);
                        break;
                    }
                    case "n": {
                        const nextY = clamp(
                            startCrop.y + dy,
                            imgMinY,
                            startCrop.y + startCrop.height - minH,
                        );
                        height = startCrop.y + startCrop.height - nextY;
                        y = nextY;
                        break;
                    }
                    case "se": {
                        width = clamp(startCrop.width + dx, minW, imgMaxX - startCrop.x);
                        height = clamp(startCrop.height + dy, minH, imgMaxY - startCrop.y);
                        break;
                    }
                    case "sw": {
                        const nextX = clamp(
                            startCrop.x + dx,
                            imgMinX,
                            startCrop.x + startCrop.width - minW,
                        );
                        width = startCrop.x + startCrop.width - nextX;
                        x = nextX;
                        height = clamp(startCrop.height + dy, minH, imgMaxY - startCrop.y);
                        break;
                    }
                    case "ne": {
                        width = clamp(startCrop.width + dx, minW, imgMaxX - startCrop.x);
                        const nextY = clamp(
                            startCrop.y + dy,
                            imgMinY,
                            startCrop.y + startCrop.height - minH,
                        );
                        height = startCrop.y + startCrop.height - nextY;
                        y = nextY;
                        break;
                    }
                    case "nw": {
                        const nextX = clamp(
                            startCrop.x + dx,
                            imgMinX,
                            startCrop.x + startCrop.width - minW,
                        );
                        const nextY = clamp(
                            startCrop.y + dy,
                            imgMinY,
                            startCrop.y + startCrop.height - minH,
                        );
                        width = startCrop.x + startCrop.width - nextX;
                        height = startCrop.y + startCrop.height - nextY;
                        x = nextX;
                        y = nextY;
                        break;
                    }
                }
                return { x, y, width, height };
            }

            // Locked aspect ratio
            const R = aspectRatio;

            switch (handle) {
                case "se": {
                    const maxW = Math.min(imgMaxX - startCrop.x, (imgMaxY - startCrop.y) * R);
                    const delta = (dx + dy * R) / 2;
                    const newW = clamp(startCrop.width + delta, minW, maxW);
                    return { x: startCrop.x, y: startCrop.y, width: newW, height: newW / R };
                }
                case "nw": {
                    const anchorX = startCrop.x + startCrop.width;
                    const anchorY = startCrop.y + startCrop.height;
                    const maxW = Math.min(anchorX - imgMinX, (anchorY - imgMinY) * R);
                    const delta = (dx + dy * R) / 2;
                    const newW = clamp(startCrop.width - delta, minW, maxW);
                    const newH = newW / R;
                    return { x: anchorX - newW, y: anchorY - newH, width: newW, height: newH };
                }
                case "ne": {
                    const anchorX = startCrop.x;
                    const anchorY = startCrop.y + startCrop.height;
                    const maxW = Math.min(imgMaxX - anchorX, (anchorY - imgMinY) * R);
                    const delta = (dx - dy * R) / 2;
                    const newW = clamp(startCrop.width + delta, minW, maxW);
                    const newH = newW / R;
                    return { x: anchorX, y: anchorY - newH, width: newW, height: newH };
                }
                case "sw": {
                    const anchorX = startCrop.x + startCrop.width;
                    const anchorY = startCrop.y;
                    const maxW = Math.min(anchorX - imgMinX, (imgMaxY - anchorY) * R);
                    const delta = (-dx + dy * R) / 2;
                    const newW = clamp(startCrop.width + delta, minW, maxW);
                    const newH = newW / R;
                    return { x: anchorX - newW, y: anchorY, width: newW, height: newH };
                }
                case "e":
                case "w": {
                    const isEast = handle === "e";
                    const anchorX = isEast ? startCrop.x : startCrop.x + startCrop.width;
                    const maxWFromBoundary = isEast ? imgMaxX - anchorX : anchorX - imgMinX;
                    const maxH = img.height;
                    const maxW = Math.min(maxWFromBoundary, maxH * R);
                    const delta = isEast ? dx : -dx;
                    const newW = clamp(startCrop.width + delta, minW, maxW);
                    const newH = newW / R;
                    const centerY = startCrop.y + startCrop.height / 2;
                    const nextY = clamp(centerY - newH / 2, imgMinY, imgMaxY - newH);
                    return {
                        x: isEast ? anchorX : anchorX - newW,
                        y: nextY,
                        width: newW,
                        height: newH,
                    };
                }
                case "s":
                case "n": {
                    const isSouth = handle === "s";
                    const anchorY = isSouth ? startCrop.y : startCrop.y + startCrop.height;
                    const maxHFromBoundary = isSouth ? imgMaxY - anchorY : anchorY - imgMinY;
                    const maxW = img.width;
                    const maxH = Math.min(maxHFromBoundary, maxW / R);
                    const delta = isSouth ? dy : -dy;
                    const newH = clamp(startCrop.height + delta, minH, maxH);
                    const newW = newH * R;
                    const centerX = startCrop.x + startCrop.width / 2;
                    const nextX = clamp(centerX - newW / 2, imgMinX, imgMaxX - newW);
                    return {
                        x: nextX,
                        y: isSouth ? anchorY : anchorY - newH,
                        width: newW,
                        height: newH,
                    };
                }
            }
        },
        [aspectRatio, minCropSize],
    );

    // Global Pointer Events handling
    const handlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>, handle?: HandlePosition) => {
            if (disabled) return;
            e.stopPropagation();

            activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (activePointersRef.current.size === 1) {
                setIsInteracting(true);
                setActiveHandle(handle ?? null);

                dragStateRef.current = {
                    type: handle ? "resize" : "pan",
                    handle,
                    startX: e.clientX,
                    startY: e.clientY,
                    startCrop: { ...cropBox },
                    startImage: { ...imageTransform },
                };
            } else if (activePointersRef.current.size === 2) {
                // Multi-touch pinch zoom initiation
                const pts = Array.from(activePointersRef.current.values());
                const p1 = pts[0];
                const p2 = pts[1];
                if (p1 && p2) {
                    pinchStartDistRef.current = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                    pinchStartZoomRef.current = imageTransform.zoom;
                }
            }
        },
        [cropBox, disabled, imageTransform],
    );

    useEffect(() => {
        const handleGlobalPointerMove = (e: PointerEvent) => {
            if (activePointersRef.current.has(e.pointerId)) {
                activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            }

            // Handle two-finger pinch zoom
            if (activePointersRef.current.size === 2 && pinchStartDistRef.current !== null) {
                const pts = Array.from(activePointersRef.current.values());
                const p1 = pts[0];
                const p2 = pts[1];
                if (p1 && p2) {
                    const currentDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                    const scaleDelta = currentDist / pinchStartDistRef.current;
                    const rect = containerRef.current?.getBoundingClientRect();
                    const midX = rect ? (p1.x + p2.x) / 2 - rect.left : containerSize.width / 2;
                    const midY = rect ? (p1.y + p2.y) / 2 - rect.top : containerSize.height / 2;

                    applyZoomAtPoint(pinchStartZoomRef.current * scaleDelta, midX, midY);
                }
                return;
            }

            const drag = dragStateRef.current;
            if (!drag) return;

            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;

            if (drag.type === "pan") {
                const nextX = drag.startImage.x + dx;
                const nextY = drag.startImage.y + dy;
                const clamped = clampImagePosition(
                    nextX,
                    nextY,
                    drag.startImage.width,
                    drag.startImage.height,
                    drag.startCrop,
                );

                setImageTransform((prev) => {
                    const updated: ImageTransform = {
                        ...prev,
                        x: clamped.x,
                        y: clamped.y,
                    };
                    notifyCropChange(drag.startCrop, updated, naturalSize);
                    return updated;
                });
            } else if (drag.type === "resize" && drag.handle) {
                const nextCrop = calculateResize(
                    drag.handle,
                    drag.startCrop,
                    dx,
                    dy,
                    drag.startImage,
                );
                setCropBox(nextCrop);
                notifyCropChange(nextCrop, drag.startImage, naturalSize);
            }
        };

        const handleGlobalPointerUp = (e: PointerEvent) => {
            activePointersRef.current.delete(e.pointerId);

            if (activePointersRef.current.size < 2) {
                pinchStartDistRef.current = null;
            }
            if (activePointersRef.current.size === 0) {
                dragStateRef.current = null;
                setIsInteracting(false);
                setActiveHandle(null);
            }
        };

        window.addEventListener("pointermove", handleGlobalPointerMove, { passive: false });
        window.addEventListener("pointerup", handleGlobalPointerUp);
        window.addEventListener("pointercancel", handleGlobalPointerUp);

        return () => {
            window.removeEventListener("pointermove", handleGlobalPointerMove);
            window.removeEventListener("pointerup", handleGlobalPointerUp);
            window.removeEventListener("pointercancel", handleGlobalPointerUp);
        };
    }, [
        applyZoomAtPoint,
        calculateResize,
        clampImagePosition,
        containerSize,
        naturalSize,
        notifyCropChange,
    ]);

    const reset = useCallback(() => {
        if (naturalSize.width > 0 && containerSize.width > 0) {
            initPositions(
                containerSize.width,
                containerSize.height,
                naturalSize.width,
                naturalSize.height,
            );
        }
    }, [containerSize, naturalSize, initPositions]);

    const setZoom = useCallback(
        (z: number) => {
            applyZoomAtPoint(z, containerSize.width / 2, containerSize.height / 2);
        },
        [applyZoomAtPoint, containerSize],
    );

    return {
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
    };
}
