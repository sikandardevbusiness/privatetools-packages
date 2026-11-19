# PrivateTools Packages

A powerful, framework-agnostic monorepo containing a suite of high-performance, privacy-first media processing utilities. Built with modern web technologies, these tools are designed to run efficiently directly in the browser, leveraging WebAssembly, OffscreenCanvas, and the Origin Private File System (OPFS) for optimal performance and zero server uploads.

## 📦 Packages

This monorepo contains the following core open-source package:

| Package                                                                       | Description                                                                                       |
| :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| [@privatetools/react-image-cropper](./packages/react-image-cropper/README.md) | A lightweight, privacy-first React image cropper built for Tailwind and shadcn. 100% client-side. |

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/sikandardevbusiness/privatetools.git
    cd privatetools
    ```

2. Install all workspace dependencies:

    ```bash
    pnpm install
    ```

3. Build all packages:

    ```bash
    pnpm run build
    ```

## 🛠️ Available Scripts

Run these commands from the root of the monorepo:

- `pnpm run build` - Build all packages in the workspace.
- `pnpm run dev` - Start development watch mode for all packages.
- `pnpm run lint` - Run ESLint across all packages.
- `pnpm run format` - Format all files using Prettier.
- `pnpm run check-types` - Run TypeScript type checking across the workspace.

### Package-Specific Commands

To run a script for a specific package, use the `--filter` flag:

```bash
# Build only the react-image-cropper
pnpm --filter @privatetools/react-image-cropper run build

# Start dev watch mode for the react-image-cropper
pnpm --filter @privatetools/react-image-cropper run dev

# Run linting for the react-image-cropper
pnpm --filter @privatetools/react-image-cropper run lint
```

## 📂 Monorepo Structure

```bash
privatetools/
├── examples/
│   └── web/                      # Next.js web application
├── packages/
│   └── react-image-cropper/      # Open-source React image cropper package
├── tooling/                      # Shared ESLint, TypeScript, and Prettier configs
├── patches/                      # pnpm patches for dependency fixes
├── pnpm-workspace.yaml           # Workspace configuration
├── package.json                  # Root package.json with shared scripts
├── turbo.json                    # Turborepo configuration
└── README.md                     # This file
```

## 🧪 Testing & Quality

This project uses strict TypeScript, ESLint, and Prettier to ensure code quality.

To run checks for a specific package:

```bash
pnpm --filter @privatetools/react-image-cropper run lint
pnpm --filter @privatetools/react-image-cropper run build
```

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

> Built with ❤️ by [PrivateTools](https://www.privatetools.in/) – 60+ free, privacy-first online tools.
