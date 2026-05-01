---
description: Start the dev server and show a phone-friendly URL + QR code.
---

Run `bun run show` in the background. Then print:
- The local URL (http://localhost:3000)
- The LAN URL (e.g., http://192.168.x.x:3000) for phone testing — derive from `ifconfig | grep "inet " | grep -v 127.0.0.1`.
- A QR code for the LAN URL using `bunx qrcode-terminal <url>`.

Tell the kid: "Open this on your phone! 📱"
