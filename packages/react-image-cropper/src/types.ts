import type React from "react";

export type OutputFormat = "png" | "jpg" | "webp";

export type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export interface Point {
    x: number;
    y: number;
}

export interface Dimensions {
    width: number;
    height: number;
}

/** Pixel crop bounds relative to natural image dimensions */
export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Stencil bounding box relative to the cropper container */
export interface PixelCrop {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Image transformation state inside the viewport */
export interface ImageTransform {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
}

export interface CropperRef {
    /** Returns HTMLCanvasElement with cropped pixels & transparent corners if radius > 0 */
    getCroppedCanvas: () => HTMLCanvasElement | null;
    /** Returns a Blob of the cropped result in the specified format */
    getCroppedBlob: (quality?: number) => Promise<Blob | null>;
    /** Returns Data URL of the cropped result */
    getCroppedDataURL: (quality?: number) => string | null;
    /** Resets zoom and centers the crop box */
    reset: () => void;
    /** Returns current zoom factor (1 to 5) */
    getZoom: () => number;
    /** Manually sets the zoom factor (clamped between minZoom and maxZoom) */
    setZoom: (zoom: number) => void;
}

export interface CropperProps {
    /** Image URL or Data URL */
    src: string;
    /** Aspect ratio as width / height (e.g. 1, 16/9, 4/3). Undefined for free-form */
    aspectRatio?: number;
    /** Border radius in percentage from 0 (sharp) to 50 (circle/pill) */
    borderRadius?: number;
    /** Toggle rule-of-thirds grid (default: true) */
    showGrid?: boolean;
    /** Export image mime type format */
    outputFormat?: OutputFormat;
    /** Minimum crop box size in screen pixels (default: 40) */
    minCropSize?: number;
    /** Minimum zoom factor (default: 1.0) */
    minZoom?: number;
    /** Maximum zoom factor (default: 5.0) */
    maxZoom?: number;
    /** Callback fired whenever the natural crop coordinates change */
    onCropChange?: (crop: CropArea) => void;
    /** Optional class name for the wrapper */
    className?: string;
    /** Optional inline styles for the wrapper */
    style?: React.CSSProperties;
    /** Disable user gestures */
    disabled?: boolean;
}
