# WebRTC Basics

Ref.:
- https://en.wikipedia.org/wiki/WebRTC
- https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API

## What is WebRTC?

WebRTC (Web Real-Time Communication) is an open-source technology that enables real-time peer-to-peer communication directly between browsers.

## Key Concepts

### 1. Signaling
- Process of coordinating communication between peers
- Exchange of session descriptions (SDP) and network information (ICE candidates)
- **Not part of WebRTC specification** - can use any protocol (WebSocket, HTTP, etc.)

### 2. SDP (Session Description Protocol)
- Describes multimedia session parameters
- **Offer**: Initial session description from caller
- **Answer**: Response session description from callee

### 3. ICE (Interactive Connectivity Establishment)
- Framework for connecting peers across NATs and firewalls
- **Candidates**: Possible network paths between peers
- **STUN**: Helps discover public IP addresses
- **TURN**: Relay server when direct connection impossible

## Architecture Patterns

### P2P (Peer-to-Peer)
```
👤 A ←──── Direct WebRTC ────→ 👤 B
```
**Pros:** Low latency, no server load  
**Cons:** Limited to 2-4 participants

### SFU (Selective Forwarding Unit)
```
👤 A ──→ 🖥️ Server ──→ 👤 B,C,D
👤 B ──→ 🖥️ Server ──→ 👤 A,C,D
```
**Pros:** Scalable, selective streaming  
**Cons:** Server bandwidth usage

### MCU (Multipoint Control Unit)
```
👤 A,B,C ──→ 🖥️ Server(mix) ──→ 👤 A,B,C
```
**Pros:** Low client bandwidth  
**Cons:** High server processing, latency

## Implementation Steps

1. **Set up signaling server** (WebSocket, Socket.IO, etc.)
2. **Create PeerConnection** with ICE servers
3. **Exchange offers/answers** via signaling
4. **Exchange ICE candidates** via signaling  
5. **Add media tracks** (audio/video)
6. **Handle connection events**

## Common Use Cases

- **Video calling** (Zoom, Teams, Google Meet)
- **Live streaming** (Twitch, YouTube Live)
- **Gaming** (multiplayer, voice chat)
- **File sharing** (peer-to-peer transfer)
- **IoT communication** (device-to-device)

## WebRTC Connection States
- `new` → `connecting` → `connected` → `disconnected`/`closed`

## Common Gotchas
- **Signaling ≠ WebRTC**: Signaling is just coordination, not the actual connection
- **STUN/TURN Required**: Most real networks need these servers
- **Browser Differences**: Chrome/Firefox may behave slightly differently