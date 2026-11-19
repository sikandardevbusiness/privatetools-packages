# 🖼️ React Image Cropper

A privacy-first, lightweight, and fully typed image cropper for React. Built for Tailwind CSS, shadcn/ui, and zero-config DX.

🔒 **100% Client-Side:** Your images are processed locally in the browser. They are **never** uploaded to a server.

[![npm version](https://img.shields.io/npm/v/@privatetools/react-image-cropper.svg)](https://www.npmjs.com/package/@privatetools/react-image-cropper)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@privatetools/react-image-cropper)](https://bundlephobia.com/package/@privatetools/react-image-cropper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Live Preview & Screenshots

**Try it live on our website:** [Open the Universal Image Cropper](https://privatetools.in/tools/image/universal-image-cropper)  
_(100% free, no login required, runs entirely in your browser using this exact package)._

### 🎥 See it in action

![Cropper Demo GIF](PLACEHOLDER_FOR_YOUR_GITHUB_GIF_URL)

## 🚀 Installation

```bash
npm install @privatetools/react-image-cropper
# or
yarn add @privatetools/react-image-cropper
# or
pnpm add @privatetools/react-image-cropper
```

## ⚡ Quick Start

Get a fully functional, touch-friendly image cropper in seconds:

```tsx
import { useState, useRef } from "react";
import { Cropper, type CropperRef } from "@privatetools/react-image-cropper";

export default function AvatarUploader() {
    const cropperRef = useRef<CropperRef>(null);
    const [imageSrc, setImageSrc] = useState<string>("/your-image.jpg");

    const handleCrop = async () => {
        if (!cropperRef.current) return;

        // Get the cropped image as a Blob (perfect for uploading to your server)
        const blob = await cropperRef.current.getCroppedBlob(0.92);
        if (blob) {
            console.log("Cropped image ready!", blob);
            // const formData = new FormData();
            // formData.append('avatar', blob, 'avatar.png');
            // await fetch('/api/upload', { method: 'POST', body: formData });
        }
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            <Cropper
                ref={cropperRef}
                src={imageSrc}
                aspectRatio={1} // 1:1 for avatars
                borderRadius={50} // 50% for a perfect circle
                outputFormat="png"
                className="rounded-lg border border-gray-200"
            />
            <button
                onClick={handleCrop}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
                Crop & Upload
            </button>
        </div>
    );
}
```

## 🌟 Why use this package?

| Feature                 | `react-image-crop` | `react-easy-crop` | `@privatetools/react-image-cropper` |
| ----------------------- | ------------------ | ----------------- | ----------------------------------- |
| TypeScript First        | ⚠️ Partial         | ❌ No             | ✅ 100% Strict                      |
| Tailwind / shadcn Ready | ❌ Custom CSS      | ❌ Custom CSS     | ✅ Native Support                   |
| Mobile Touch Gestures   | ❌ Basic           | ✅ Yes            | ✅ Smooth Pinch & Drag              |
| Circular Crop (Avatars) | ❌ Manual          | ✅ Yes            | ✅ Built-in `borderRadius`          |
| Bundle Size             | ~12kb              | ~15kb             | ~4kb (Zero Dependencies)            |
| Privacy / Client-Side   | ✅ Yes             | ✅ Yes            | ✅ Explicitly Guaranteed            |

> **Note**: This data may not be accurate because we haven't tested other packages extensively.

## 📖 API Reference

### `<Cropper />` Props

| Prop                | Type                       | Default     | Description                                                                                       |
| ------------------- | -------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `src`               | `string`                   | Required    | The URL or Data URL of the image to crop.                                                         |
| `aspectRatio`       | `number`                   | `undefined` | Locks the crop box to a specific ratio (e.g., `1`, `16/9`, `4/3`). Leave undefined for free-form. |
| `borderRadius`      | `number`                   | `0`         | Border radius in percentage (`0` to `50`). `50` creates a perfect circle.                         |
| `showGrid`          | `boolean`                  | `true`      | Toggles the rule-of-thirds grid overlay.                                                          |
| `outputFormat`      | `'png' \| 'jpg' \| 'webp'` | `'png'`     | The MIME type format for the exported canvas/blob.                                                |
| `minCropSize`       | `number`                   | `40`        | Minimum crop box size in screen pixels.                                                           |
| `minZoom / maxZoom` | `number`                   | `1.0 / 5.0` | Boundaries for zooming in/out.                                                                    |
| `onCropChange`      | `(crop: CropArea) => void` | `undefined` | Callback fired whenever the natural crop coordinates change.                                      |
| `className / style` | `string / CSSProperties`   | `undefined` | Standard React styling props for the wrapper div.                                                 |
| `disabled`          | `boolean`                  | `false`     | Disables all user gestures (pan, zoom, resize).                                                   |

### Imperative Ref API (CropperRef)

Access these methods via `useRef<CropperRef>(null)` to control the cropper or export the result:

| Method                        | Description                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `getCroppedCanvas()`          | Returns an `HTMLCanvasElement` with the cropped pixels and transparent corners (if `borderRadius > 0`). |
| `getCroppedBlob(quality?)`    | Returns a `Promise<Blob>` of the cropped result. Perfect for FormData uploads.                          |
| `getCroppedDataURL(quality?)` | Returns a `string` Data URL of the cropped result. Perfect for immediate preview.                       |
| `reset()`                     | Resets zoom to `1.0` and re-centers the crop box.                                                       |
| `getZoom()`                   | Returns the current zoom factor (e.g., `1.5`).                                                          |
| `setZoom(zoom: number)`       | Manually sets the zoom factor (clamped between `minZoom` and `maxZoom`).                                |

## 🤝 Contributing & Support

Maintained by the team at [PrivateTools](https://privatetools.in/) – 60+ free, privacy-first online tools.

If you find this package useful, please consider:

- Giving it a ⭐️ on GitHub!
- [Buying me a coffee](https://buymeacoffee.com/sikandardevbusiness) to support ongoing development.
