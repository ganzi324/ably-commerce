# Ably Commerce - Mobile PDA Warehouse Inbound Inspection System

## Project Overview
This project is a lightweight web prototype for a mobile PDA-based warehouse inbound inspection system. It allows warehouse workers to scan ASNs, list SKUs, and perform detailed inspections including quantity input and defect handling.

### Technologies
- **Frontend:** React (TypeScript) with Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React (available but optional)
- **State Management:** Simple React `useState` (as per requirements)

### Architecture
- **Single Page Application:** Uses conditional rendering for screen navigation (ASN Input -> SKU List -> Detail).
- **Mobile First:** Optimized for 360px width mobile PDA devices.

## Building and Running

### Prerequisites
- Node.js (v18+)
- npm

### Commands
- `npm install`: Install dependencies.
- `npm run dev`: Start the development server.
- `npm run build`: Build the project for production.
- `npm run preview`: Preview the production build.

## Development Conventions
- **Keep it Simple:** Avoid unnecessary abstractions or complex routing libraries.
- **Surgical Updates:** When modifying features, focus on the specific logic (e.g., Quantity Input, Defect Handling).
- **Styling:** Use utility-first CSS with Tailwind.
- **State:** Use local component state whenever possible.

### Key Features Reference
1. **Quantity Input:** Uses large +/- buttons for PDA interaction.
2. **Defect Handling:** Prompt-based defect reason entry with aggregation for same reasons.
3. **Barcode Generation:** Random barcode generation for items without existing barcodes.
4. **Mobile Layout:** Centered 360px layout for simulation on desktop browsers.
