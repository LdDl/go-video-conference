# Simple P2P Video Call Example without actual media

Basic 1-on-1 video call example with WebSocket signaling and WebRTC data channels, but without real media enabled.

## 🚀 Running

```bash
# From project root directory
cd examples/01-simple-p2p-nomedia
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
   - Click "Call"
   - Status changes to "🔄 Connecting..."

4. **In tab B:**
   - Incoming call notification appears automatically
   - Click notification
   - Status changes to "✅ Call active"

### Verifying Connection:

5. **Open DevTools (F12) in both tabs:**
   - Tab A: should show "Received: Hello back from B"
   - Tab B: should show "Received: Hello from A"

6. **Check statistics:**
   - Click "Show WebRTC Statistics"
   - Should display: "✅ WebRTC connection fully active!"

7. **End call:**
   - Click "End Call" in either tab
   - Status changes to "❌ Call ended"

## 🔍 Expected Logs

### Server (console):
```
Server running on :8080
User A registered
User B registered
Call from A to B
Answer from B to A
ICE candidate from A to B
ICE candidate from B to A
```

### Browser A (DevTools Console):
```
WebSocket connected
Calling user B...
ICE Gathering state: gathering
Sending ICE candidate: host
WebRTC Connection state: connecting
WebRTC Connection state: connected
Data channel opened
Received: Hello back from B
```

### Browser B (DevTools Console):
```
WebSocket connected
Incoming call from A
Buffering ICE candidate
Answering call from A
Processing buffered ICE candidate
WebRTC Connection state: connected
Data channel opened (receiver)
Received: Hello from A
```

## 🏗️ Architecture

```
[Browser A] ←── WebSocket ──→ [Go Server] ←── WebSocket ──→ [Browser B]
     ↓                            ↑                            ↑
     └─────────── WebRTC P2P Direct ────────────────────────────┘
```

### Components:

1. **Go Server (main.go):**
   - WebSocket server for signaling
   - Client registration
   - Message routing (call/answer/ice)

2. **Web Client (index.html + index.js):**
   - WebSocket client
   - WebRTC PeerConnection
   - Data Channel for connection testing
   - Call management UI

### Message Types:

- `register` - user registration
- `call` - call initiation (contains SDP offer)  
- `answer` - call answer (contains SDP answer)
- `ice` - ICE candidate exchange

## 🔧 Troubleshooting

### Issue: "WebSocket disconnected"
- **Cause:** Server not running or unreachable
- **Solution:** Ensure `go run main.go` runs without errors

### Issue: "Received ICE candidate: undefined" 
- **Cause:** Normal behavior for end-of-candidates
- **Solution:** Ignore, this is not an error

### Issue: Call doesn't establish
- **Check:**
  - User IDs are different ("A" and "B")
  - Contact selected before calling  
  - WebSocket connections active
  - No errors in DevTools Console

### Issue: "Data channel not active"
- **Cause:** ICE connection not established
- **Solution:** Restart server and try again

## 📈 What's Next?

After studying this example, proceed to [02-room-system](../02-room-system/) for room-based and group calling functionality.