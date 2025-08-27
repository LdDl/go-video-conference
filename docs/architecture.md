# Architecture Guide

## Project Structure

```
go-video-conference/
├── examples/
│   ├── 01-simple-p2p-nomedia/  # Basic P2P with data channels
│   ├── 02-simple-p2p-media/    # P2P with video/audio
│   ├── 03-room-system-nomedia/ # Room system, data only (@todo)
│   └── 04-room-system-media/   # Room system with media (@todo)
├── docs/                       # Documentation
└── README.md                   # Main documentation
```

## Examples 01 & 02: Simple P2P

### Components

#### Go Server (`main.go`)
- **Purpose**: WebSocket signaling server
- **Responsibilities**:
  - Client registration and management
  - Message routing between peers
  - Connection lifecycle handling
- **Same for both examples** - media handled client-side

#### Web Client (`ui/`)
- **HTML**: User interface for calling
- **JavaScript**: WebRTC logic and WebSocket communication
- **Example 01**: Data channels only
- **Example 02**: Data channels + real media streams

### Message Flow (Same for both examples)

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Client A  │                    │  Go Server  │                    │   Client B  │
│             │                    │ (WebSocket) │                    │             │
└─────────────┘                    └─────────────┘                    └─────────────┘
       │                                   │                                   │
       │ 1. register: {from: "A"}          │                                   │
       │──────────────────────────────────→│                                   │
       │                                   │   2. register: {from: "B"}        │
       │                                   │←──────────────────────────────────│
       │                                   │                                   │
       │ 3. call: {from:"A", to:"B", sdp}  │                                   │
       │──────────────────────────────────→│                                   │
       │                                   │ 4. call: {from:"A", to:"B", sdp}  │
       │                                   │──────────────────────────────────→│
       │                                   │                                   │
       │                                   │ 5. answer: {from:"B", to:"A", sdp}│
       │ 6. answer: {from:"B", to:"A", sdp}│←──────────────────────────────────│
       │←──────────────────────────────────│                                   │
       │                                   │                                   │
       │ 7-10. ICE candidates exchange     │                                   │
       │←─────────────────────────────────→│←─────────────────────────────────→│
       │                                   │                                   │
       └─────────────────WebRTC P2P Direct Connection────────────────────────→│
                                           │                                   │
       ┌───Data Channel: "Hello" ──────────────────────────────────────────→│
       │                                   │                                   │
       │←──Data Channel: "Hello back" ─────────────────────────────────────────┘
       │                                   │                                   │
       │  📹 Example 02: Video/Audio streams flow directly here               │
       │←─────────────────────────────────→│                                   │
       │              Call active          │                                   │
       ▼                                   ▼                                   ▼
```

### Actual Key Differences Between Examples

| Feature | Example 01 (nomedia) | Example 02 (media) |
|---------|----------------------|---------------------|
| **WebSocket Signaling** | ✅ Identical | ✅ Identical |
| **Data Channels** | ✅ Full implementation | ✅ Same implementation |
| **Message Protocol** | ✅ Same JSON messages | ✅ Same JSON messages |
| **UI Components** | ✅ Same dropdowns/buttons | ✅ Same dropdowns/buttons |
| **getUserMedia()** | ❌ Not called | ✅ Camera + mic access |
| **pc.addTrack()** | ❌ No media tracks | ✅ Adds video/audio tracks |
| **pc.ontrack** | ❌ No handler | ✅ Receives remote streams |
| **Video Elements** | ❌ Not used | ✅ Shows local/remote video |
| **Media Cleanup** | ❌ No streams to clean | ✅ Stops tracks on call end |


### Detailed Message Types

#### 1. Registration Phase
```json
// Client -> Server
{"type": "register", "from": "A"}
{"type": "register", "from": "B"}
```

#### 2. Call Initiation Phase
```json
// Client A -> Server -> Client B
{
  "type": "call",
  "from": "A", 
  "to": "B",
  "sdp": "{\"type\":\"offer\",\"sdp\":\"v=0\\r\\n...\"}"
}
```

#### 3. Call Answer Phase
```json
// Client B -> Server -> Client A
{
  "type": "answer",
  "from": "B",
  "to": "A", 
  "sdp": "{\"type\":\"answer\",\"sdp\":\"v=0\\r\\n...\"}"
}
```

#### 4. ICE Candidate Exchange
```json
// Bidirectional: Client <-> Server <-> Client
{
  "type": "ice",
  "from": "A",
  "to": "B",
  "candidate": "{\"candidate\":\"candidate:1 1 UDP...\",\"sdpMLineIndex\":0}"
}
```

### Connection Timeline

1. **WebSocket Setup** (0-100ms)
   - Both clients connect to server
   - Registration messages exchanged

2. **Call Signaling** (100-500ms)
   - Offer/Answer SDP exchange via WebSocket
   - ICE candidate gathering begins

3. **ICE Processing** (500-2000ms)
   - Multiple ICE candidates exchanged
   - STUN server connectivity tests
   - Best connection path selected

4. **WebRTC Established** (1000-3000ms)
   - Direct P2P connection active
   - Data channel opens
   - Server no longer needed for data

### State Management

#### Server State
```go
var clients = make(map[string]*websocket.Conn)
// userID -> WebSocket connection
```

#### Client State
```javascript
let ws;          // WebSocket connection
let pc;          // RTCPeerConnection
let userId;      // Current user ID
let targetId;    // Call target ID
```

## Example 02: Room System (@todo)

### Planned Message Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User A    │    │   User B    │    │  Go Server  │    │   User C    │
│             │    │             │    │   (Rooms)   │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. invite B to call                   │                   │
       │──────────────────────────────────────→│                   │
       │                   │ 2. invite from A  │                   │
       │                   │←──────────────────│                   │
       │                   │ 3. accept invite  │                   │
       │                   │──────────────────→│                   │
       │ 4. room created: room_ABC              │                   │
       │←──────────────────────────────────────│                   │
       │                   │ 5. joined room    │                   │
       │                   │←──────────────────│                   │
       │                                       │                   │
       │ 6. invite C to room                   │                   │
       │──────────────────────────────────────→│                   │
       │                                       │ 7. invite to room │
       │                                       │──────────────────→│
       │                                       │ 8. accept         │
       │                                       │←──────────────────│
       │                                       │                   │
       └─────────────P2P Mesh: A↔B, A↔C, B↔C─────────────────────→│
```

## Design Decisions

### Why WebSocket for Signaling?
- **Real-time**: Bi-directional, low-latency communication
- **Simple**: Easy to implement and debug
- **Scalable**: Can handle many concurrent connections
- **Alternative**: HTTP long-polling, Server-Sent Events

### Why Data Channels First?
- **No media permissions**: Works without camera/mic access
- **Testing**: Easy to verify WebRTC connectivity
- **Foundation**: Same principles apply to audio/video

### Why Go Backend?
- **Performance**: Excellent concurrency with goroutines
- **Simplicity**: Clean syntax, easy to understand
- **Ecosystem**: Good WebSocket libraries (Gorilla)
- **Future**: Pion WebRTC for server-side processing

## Security Considerations

### Production Checklist
- [ ] **CORS**: Proper origin validation
- [ ] **WSS**: Use secure WebSocket (TLS)
- [ ] **Authentication**: User verification
- [ ] **Rate limiting**: Prevent spam/abuse
- [ ] **Input validation**: Sanitize all messages
- [ ] **STUN/TURN**: Secure ICE servers

### Example Security Headers
```go
upgrader := websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        origin := r.Header.Get("Origin")
        return origin == "https://yourdomain.com"
    },
}
```

## Performance Optimization

### Client Side
- **Connection pooling**: Reuse WebSocket connections
- **Efficient SDP**: Minimize offer/answer size
- **ICE optimization**: Prefer host candidates

### Server Side
- **Connection limits**: Max clients per server
- **Message buffering**: Batch operations
- **Memory management**: Clean up disconnected clients

## Testing Strategy

### Unit Testing
- Message serialization/deserialization
- Connection state management
- Error handling

### Integration Testing
- End-to-end call flow
- Multiple concurrent calls
- Network failure scenarios

### Load Testing
- Maximum concurrent connections
- Message throughput
- Memory usage under load