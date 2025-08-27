# Go WebRTC Video Conference Examples

Educational examples of video conferencing implementation using Go and WebRTC.

## 📚 Table of Contents

- [Quick Start](#-quick-start)
  - [Requirements](#requirements)
  - [Installation and Setup](#installation-and-setup)
- [How to Use (Single PC Testing)](#-how-to-use-single-pc-testing)
  - [Example 01-02: Simple P2P with/without media](#example-01-02-simple-p2p-withwithout-media)
  - [Server Logs](#-server-logs)
  - [Troubleshooting](#-troubleshooting)
- [Examples Overview](#-examples-overview)
  - [01-simple-p2p-nomedia and 02-simple-p2p-media](#01-simple-p2p-nomedia-and-02-simple-p2p-media-)
  - [03-room-system](#03-room-system---todo)
- [Architecture Patterns](#️-architecture-patterns)
  - [P2P Mesh (Examples 01 & 02)](#p2p-mesh-examples-01--02)
  - [Room-based P2P (Example 03)](#room-based-p2p-example-03---todo)
  - [Future: SFU Architecture](#future-sfu-architecture)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Additional Documentation](#-additional-documentation)
- [Development Notes](#-development-notes)

## 🚀 Quick Start

### Requirements
- Go 1.19+ 
- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)

### Installation and Setup

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/go-video-conference.git
cd go-video-conference
```

2. **Install dependencies:**
```bash
go mod tidy
```

3. **Run the first or the second example:**
```bash
# The first example without real media
cd examples/01-simple-p2p-nomedia
# The second example with real media
# cd examples/02-simple-p2p-media
go run main.go
```

4. **Open in browser:**
   - Open http://localhost:8080 in **first tab**
   - Open http://localhost:8080 in **second tab** 
   - In first tab leave ID = "A"
   - In second tab change ID to "B"

## 📞 How to Use (Single PC Testing)

### Example 01-02: Simple P2P with/without media

#### Step 1: Setup
- **Tab 1:** ID = "A" 
- **Tab 2:** ID = "B"
- Click "Allow notifications" to enable in-browser notifications system for the project.

#### Step 2: Make a Call
1. **In tab A:** Select contact "B" from the list
2. **In tab A:** Click "Call"
3. **In tab B:** Incoming call notification will appear automatically. Click it to accept the call.

#### Step 3: Verify Connection
- Open DevTools (F12) in both tabs
- In Console you should see messages:
  ```
  ✅ WebRTC Connection state: connected
  ✅ Data channel opened
  ✅ Received: Hello from A/B
  ```
- Status should change to "✅ Call active"

#### Step 4: Check Statistics
- Click "Show WebRTC Statistics"
- Should display: "✅ WebRTC connection fully active!"

#### Step 5: End Call
- Click "End call" in either tab
- Status changes to "❌ Call ended"

### 🔍 Server Logs

With successful call, you'll see in server console:
```
Server running on :8080
User A registered
User B registered  
Call from A to B
Answer from B to A
ICE candidate from A to B
ICE candidate from B to A
```

### 🔧 Troubleshooting

#### Issue: "WebSocket disconnected"
**Solution:** Restart server and refresh tabs

#### Issue: "No active WebRTC connection" 
**Solution:** 
1. Check that IDs are different in tabs
2. Ensure contact is selected before calling
3. Check Console for errors

#### Issue: ICE candidate errors
**Solution:** This is normal for localhost, connection should still work

## 📖 Examples Overview

### 01-simple-p2p-nomedia and 02-simple-p2p-media ✅
**Status:** Ready to use
- Basic 1-on-1 calls
- WebSocket signaling
- P2P connection via data channels
- Simple UI
- Use `*-nomedia` just for tests in case you have no media (no video/microphone), use `*-media` if you have one.

**Features:**
- ✅ User registration  
- ✅ Smart contact selection (prevents self-calling)
- ✅ Call initiation/answering with notifications
- ✅ Visual status indicators
- ✅ WebRTC connection statistics
- ✅ Graceful call termination
- ✅ ICE candidate buffering
- ✅ Connection state management

### 02-room-system - 🚧 @todo
**Status:** Planning phase

**@todo Features:**
- [ ] Room creation and management
- [ ] User invitation system  
- [ ] Multiple participant support (P2P mesh up to 4 users)
- [ ] Room-based message routing
- [ ] Participant list UI
- [ ] Join/leave room functionality
- [ ] Room persistence and cleanup
- [ ] Enhanced UI for group calling

**@todo Architecture:**
- [ ] Room management server components
- [ ] Enhanced message types (invite, join-room, leave-room)
- [ ] Multiple PeerConnection management on client
- [ ] Room state synchronization
- [ ] Scalability considerations (P2P mesh vs SFU decision)

## 🏗️ Architecture Patterns

### P2P Mesh (Example 01)
```
👤 A ←→ B 👤
```
**Advantages:** Minimal latency, simplicity  
**Limitations:** Only 1-on-1 calls  
**Use case:** Direct calls, private conversations

### Future: SFU Architecture
```
👤 A,B,C,D → 🖥️ Server(forward) → 👤 A,B,C,D
```
**Advantages:** Highly scalable, selective forwarding  
**Limitations:** Server bandwidth requirements  
**Use case:** Large conferences, webinars

### Room-based P2P (Example 02) - 🚧 @todo
```
     Room_ABC
👤 A ←→ B ←→ C 👤
 ↘     ↗
   👤 D
```
**Advantages:** Group calls, scalable up to ~4 participants  
**Limitations:** Exponential connection growth (N*(N-1)/2)  
**Use case:** Small team meetings, family calls

## 🎯 Roadmap

- [x] **v0.1:** Basic P2P call with data channels
- [ ] **v0.2:** Room system with invitations (🚧 @todo)
- [ ] **v0.3:** Real audio/video streams (🚧 @todo) 
- [ ] **v0.4:** SFU with Pion WebRTC for large groups (🚧 @todo)
- [ ] **v0.5:** Chat, screen sharing, recording (🚧 @todo)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 📚 Additional Documentation

- [WebRTC Basics](docs/webrtc-basics.md) - WebRTC fundamentals
- [Architecture Guide](docs/architecture.md) - Architectural decisions

## 📋 Development Notes

This is just intended for an educational use, as foundation for room system