# Simple P2P Video Call Example with actual media

Basic 1-on-1 video call example with WebSocket signaling and WebRTC data channels.

## 🚀 Running

```bash
# From project root directory
cd examples/02-simple-p2p-media
go run main.go
```

Server will start on http://localhost:8080

## 📱 Usage (Single PC Testing)

### Setup Two Clients:

1. **Open first tab:** http://localhost:8080
   - User ID: leave as "A"
   - Click "Allow Notifications"

2. **Open second tab:** http://localhost:8080  
   - User ID: change to "B"
   - Click "Allow Notifications"

### Making a Call:

3. **In tab A:**
   - Select contact "B" from list (will highlight gray)
   - Click "Call" and allow using media in additional popup
   - Status changes to "🔄 Connecting..."

4. **In tab B:**
   - Incoming call notification appears automatically
   - Click notification and allow using media in additional popup
   - Status changes to "✅ Call active"

Everything else should be the same as for [01-simple-p2p-nomedia](../01-simple-p2p-nomedia/), but with actual media enabled