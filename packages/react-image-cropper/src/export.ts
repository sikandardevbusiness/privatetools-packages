import type { CropArea, OutputFormat } from "./types";

/**
 * Creates an HTMLCanvasElement cropped to natural dimensions.
 * Traces a rounded rectangle path using `arcTo` so that transparent corners
 * match the CSS screen radius without jagged edges.
 */
export function getCroppedCanvas(
    image: HTMLImageElement,
    crop: CropArea,
    borderRadius: number,
    outputFormat: OutputFormat = "png",
): HTMLCanvasElement {
    const targetWidth = Math.max(1, Math.round(crop.width));
    const targetHeight = Math.max(1, Math.round(crop.height));

    // 1. Create primary canvas at natural image resolution
    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = targetWidth;
    baseCanvas.height = targetHeight;
    const baseCtx = baseCanvas.getContext("2d");

    if (!baseCtx) {
        throw new Error("Failed to create 2D context for base crop canvas");
    }

    // Draw the exact sub-rectangle of the original image
    baseCtx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        targetWidth,
        targetHeight,
    );

    // Calculate the clamped radius matching the on-screen formula
    const maxRadius = Math.min(targetWidth, targetHeight) / 2;
    const clampedRadiusPct = Math.max(0, Math.min(50, borderRadius));
    const radiusPx = Math.max(
        0,
        Math.min(maxRadius, Math.min(targetWidth, targetHeight) * (clampedRadiusPct / 100)),
    );

    // If no border radius is required, return directly (or with white background for JPEG)
    if (radiusPx <= 0) {
        if (outputFormat === "jpg") {
            const jpgCanvas = document.createElement("canvas");
            jpgCanvas.width = targetWidth;
            jpgCanvas.height = targetHeight;
            const jpgCtx = jpgCanvas.getContext("2d");
            if (jpgCtx) {
                jpgCtx.fillStyle = "#ffffff";
                jpgCtx.fillRect(0, 0, targetWidth, targetHeight);
                jpgCtx.drawImage(baseCanvas, 0, 0);
                return jpgCanvas;
            }
        }
        return baseCanvas;
    }

    // 2. Create masked canvas for rounded borders with anti-aliasing
    const outCanvas = document.createElement("canvas");
    outCanvas.width = targetWidth;
    outCanvas.height = targetHeight;
    const outCtx = outCanvas.getContext("2d");

    if (!outCtx) {
        throw new Error("Failed to create 2D context for output masked canvas");
    }

    // JPEG format does not support transparency; fill with white background
    if (outputFormat === "jpg") {
        outCtx.fillStyle = "#ffffff";
        outCtx.fillRect(0, 0, targetWidth, targetHeight);
    }

    outCtx.save();
    outCtx.beginPath();
    // Trace rounded rectangle path via arcTo
    outCtx.moveTo(radiusPx, 0);
    outCtx.arcTo(targetWidth, 0, targetWidth, targetHeight, radiusPx);
    outCtx.arcTo(targetWidth, targetHeight, 0, targetHeight, radiusPx);
    outCtx.arcTo(0, targetHeight, 0, 0, radiusPx);
    outCtx.arcTo(0, 0, targetWidth, 0, radiusPx);
    outCtx.closePath();

    // Clip to the rounded path
    outCtx.clip();

    // Blit the cropped image onto the clipped canvas
    outCtx.drawImage(baseCanvas, 0, 0);
    outCtx.restore();

    return outCanvas;
}

export function canvasToBlob(
    canvas: HTMLCanvasElement,
    format: OutputFormat = "png",
    quality: number = 0.92,
): Promise<Blob | null> {
    const mimeType = format === "jpg" ? "image/jpeg" : `image/${format}`;
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), mimeType, quality);
    });
}

export function canvasToDataURL(
    canvas: HTMLCanvasElement,
    format: OutputFormat = "png",
    quality: number = 0.92,
): string {
    const mimeType = format === "jpg" ? "image/jpeg" : `image/${format}`;
    return canvas.toDataURL(mimeType, quality);
}
