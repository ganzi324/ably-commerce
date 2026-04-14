Create a VERY SIMPLE web prototype for a mobile PDA warehouse inbound inspection system.

Tech:
- Use React with Vite (NOT Next.js)
- Use Tailwind CSS
- Single page app (no routing library needed)
- Use simple state (useState only)

UI Style:
- Mobile layout (max-width: 360px, centered)
- Large buttons, simple design
- Fast interaction focused

Screens (use conditional rendering instead of routing):
1. ASN Input
2. SKU List
3. Detail (Standard / Basic combined)

Core Features:

1. Quantity Input
- [-] [input] [+]
- Typing replaces existing number immediately

2. Defect Handling
- Add Defect button
- Select reason (prompt or simple modal)
- Same reason → increase qty
- Different → add new row

3. Barcode
- SKU List has barcode input
- Detail shows barcode input if exists

4. Basic Mode Only
- Button: "Generate & Print Barcode"
- Always visible
- If no barcode → create random barcode
- Then open popup

5. Print Popup
- Show barcode text
- Fake barcode (just box with text)
- Quantity input (default = normal qty)

6. Navigation
- Simple state switching (no router)

Mock Data:
- 3~5 SKUs only

Output:
- Full runnable project
- Keep code minimal
- No unnecessary abstraction
