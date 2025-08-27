let ws, pc;
let userId, targetId;
// Buffer for ICE candidates
let pendingIceCandidates = [];

// WebSocket connection and registration
document.addEventListener("DOMContentLoaded", async () => {
    // Initialize UI elements
    const userSelect = document.getElementById("userSelect");
    const contactSelect = document.getElementById("contactSelect");
    const callBtn = document.getElementById("callBtn");
    const selfCallWarning = document.getElementById("selfCallWarning");
    
    // Initialize with default user
    userId = userSelect.value;
    updateContactOptions();
    
    // User selection change handler
    userSelect.addEventListener("change", (e) => {
        userId = e.target.value;
        updateContactOptions();
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({type: "register", from: userId}));
        }
        console.log(`User changed to: ${userId}`);
    });
    
    // Contact selection change handler
    contactSelect.addEventListener("change", (e) => {
        targetId = e.target.value;
        updateCallButton();
    });
    
    // Update contact dropdown options
    function updateContactOptions() {
        // Reset target and selection
        targetId = "";
        contactSelect.value = "";
        updateCallButton();
        
        // Show/hide options and warning based on current user
        Array.from(contactSelect.options).forEach(option => {
            // Keep placeholder
            if (option.value === "") return;
            
            if (option.value === userId) {
                // Hide self from contacts
                option.style.display = "none";
            } else {
                // Show other contacts
                option.style.display = "block"; 
            }
        });
    }
    
    // Update call button state
    function updateCallButton() {
        const canCall = targetId && targetId !== userId && targetId !== "";
        callBtn.disabled = !canCall;
        
        if (targetId === userId) {
            selfCallWarning.style.display = "inline";
        } else {
            selfCallWarning.style.display = "none";
        }
        
        // Update button text based on state
        if (!targetId || targetId === "") {
            callBtn.textContent = "📞 Call";
        } else if (targetId === userId) {
            callBtn.textContent = "📞 Cannot call yourself";
        } else {
            callBtn.textContent = `📞 Call ${targetId}`;
        }
    }
    
    // Call button handler
    callBtn.onclick = async () => {
        if (!targetId || targetId === userId || targetId === "") {
            alert("Please select a valid contact to call");
            return;
        }
    
        try {
            // 🆕 ADD THIS: Get user media (camera + microphone)
            const localStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            // 🆕 ADD THIS: Display local video
            const localVideo = document.getElementById('localVideo');
            localVideo.srcObject = localStream;
            console.log('Local video stream started');
    
            pc = createPeerConnection();
            
            // 🆕 ADD THIS: Add media tracks to peer connection
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
                console.log(`Added ${track.kind} track`);
            });
            
            // Keep existing data channel code
            const dataChannel = pc.createDataChannel("test");
            dataChannel.onopen = () => {
                console.log("Data channel opened");
                dataChannel.send("Hello from " + userId);
            };
            dataChannel.onmessage = (event) => {
                console.log("Received:", event.data);
            };
            
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
    
            ws.send(JSON.stringify({type: "call", from: userId, to: targetId, sdp: JSON.stringify(offer)}));
            
            console.log(`Calling user ${targetId}...`);
            
            // Disable controls during call
            userSelect.disabled = true;
            contactSelect.disabled = true;
            callBtn.disabled = true;
            
        } catch (err) {
            console.error('Media access error:', err);
            alert('Camera/microphone access required for video calls!');
        }
    };

    // End call button handler
    document.getElementById("hangupBtn").onclick = () => {
        endCall();
    };
    
    function endCall() {
        if (pc) {
            pc.close();
            pc = null;
            console.log("Call ended");
            updateCallStatus('disconnected');
            pendingIceCandidates = []; // Clear buffer
        }
        
        // 🆕 ADD THIS: Stop local video streams
        const localVideo = document.getElementById('localVideo');
        const remoteVideo = document.getElementById('remoteVideo');
        
        if (localVideo && localVideo.srcObject) {
            localVideo.srcObject.getTracks().forEach(track => {
                track.stop();
                console.log(`Stopped ${track.kind} track`);
            });
            localVideo.srcObject = null;
            console.log('Local video stopped');
        }
        
        if (remoteVideo && remoteVideo.srcObject) {
            remoteVideo.srcObject = null;
            console.log('Remote video cleared');
        }
        
        // Re-enable controls
        const userSelect = document.getElementById("userSelect");
        const contactSelect = document.getElementById("contactSelect");
        
        if (userSelect) {
            userSelect.disabled = false;
        }
        
        if (contactSelect) {
            contactSelect.disabled = false;
        }
        
        updateCallButton();
    }

    // Initialize WebSocket
    ws = new WebSocket("ws://localhost:8080/ws");

    ws.onopen = () => {
        console.log("WebSocket connected");
        ws.send(JSON.stringify({type: "register", from: userId}));
    };

    ws.onclose = () => {
        console.log("WebSocket disconnected");
        updateCallStatus('disconnected');
        
        // 🆕 ADD THIS: Stop media streams on disconnect
        const localVideo = document.getElementById('localVideo');
        if (localVideo && localVideo.srcObject) {
            localVideo.srcObject.getTracks().forEach(track => {
                track.stop();
                console.log(`Stopped ${track.kind} track on disconnect`);
            });
            localVideo.srcObject = null;
        }
        
        // Re-enable controls on disconnect
        const userSelect = document.getElementById("userSelect");
        const contactSelect = document.getElementById("contactSelect");
        
        if (userSelect) {
            userSelect.disabled = false;
        }
        
        if (contactSelect) {
            contactSelect.disabled = false;
        }
        
        updateCallButton();
    };

    ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        updateCallStatus('failed', 'Server connection lost');
    };

    ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
            case "call":
                console.log(`Incoming call from ${msg.from}`);
                
                // Update UI to show incoming call
                updateCallStatus('incoming', `Incoming call from ${msg.from}`);
                
                if (Notification.permission === "granted") {
                    const n = new Notification(`Incoming call from ${msg.from}`, { 
                        requireInteraction: true,
                        body: "Click to answer"
                    });
                    n.onclick = async () => await answerCall(msg);
                } else {
                    // If notifications not allowed, answer automatically after 2 seconds
                    setTimeout(async () => {
                        await answerCall(msg);
                    }, 2000);
                }
                break;

            case "answer":
                console.log(`${msg.from} answered the call`);
                if (pc) {
                    await pc.setRemoteDescription(JSON.parse(msg.sdp));
                }
                break;

            case "ice":
                if (msg.candidate) {
                    if (pc) {
                        try { 
                            const candidate = JSON.parse(msg.candidate);
                            console.log('Received ICE candidate:', candidate?.type || 'end-of-candidates');
                            await pc.addIceCandidate(candidate);
                        } catch(e) {
                            console.error("ICE candidate error:", e);
                        }
                    } else {
                        console.log('Buffering ICE candidate');
                        pendingIceCandidates.push(msg.candidate);
                    }
                }
                break;
        }
    };
});

// Create RTCPeerConnection
function createPeerConnection() {
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // 🆕 ADD THIS: Handle incoming media streams
    pc.ontrack = (event) => {
        console.log('Remote stream received:', event.streams[0]);
        const remoteVideo = document.getElementById('remoteVideo');
        remoteVideo.srcObject = event.streams[0];
        console.log('Remote video stream displayed');
    };

    // Keep all existing handlers...
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Sending ICE candidate:', event.candidate.type);
            ws.send(JSON.stringify({
                type: "ice", 
                from: userId,
                to: targetId, 
                candidate: JSON.stringify(event.candidate)
            }));
        } else {
            console.log('ICE gathering complete');
        }
    };

    pc.onconnectionstatechange = () => {
        console.log(`WebRTC Connection state: ${pc.connectionState}`);
        updateCallStatus(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
        console.log(`ICE Connection state: ${pc.iceConnectionState}`);
    };

    pc.onicegatheringstatechange = () => {
        console.log(`ICE Gathering state: ${pc.iceGatheringState}`);
    };

    return pc;
}

// Function to display status
function updateCallStatus(state, customMessage = null) {
    const statusElement = document.getElementById('callStatus');
    let status = '';
    let color = 'black';
    let background = '#f8f9fa';
    
    if (customMessage) {
        status = customMessage;
        color = 'orange';
        background = '#fff3cd';
    } else {
        switch(state) {
            case 'connecting':
                status = '🔄 Connecting...';
                color = 'orange';
                background = '#fff3cd';
                break;
            case 'connected':
                status = '✅ Call active';
                color = 'green';
                background = '#d4edda';
                break;
            case 'disconnected':
                status = '❌ Call ended';
                color = 'red';
                background = '#f8d7da';
                break;
            case 'failed':
                status = '⚠️ Connection error';
                color = 'red';
                background = '#f8d7da';
                break;
            default:
                status = '⏸️ Waiting';
                color = 'gray';
                background = '#f8f9fa';
        }
    }
    
    statusElement.textContent = status;
    statusElement.style.color = color;
    statusElement.style.background = background;
}

// Answer call
async function answerCall(msg) {
    targetId = msg.from;
    
    try {
        // 🆕 ADD THIS: Get user media when answering
        const localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        
        // 🆕 ADD THIS: Display local video
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = localStream;
        console.log('Local video stream started (answering)');

        pc = createPeerConnection();

        // 🆕 ADD THIS: Add media tracks to peer connection
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
            console.log(`Added ${track.kind} track (answering)`);
        });

        // Update UI
        document.getElementById("contactSelect").value = targetId;
        document.getElementById("userSelect").disabled = true;
        document.getElementById("contactSelect").disabled = true;
        document.getElementById("callBtn").disabled = true;

        // Keep existing data channel handler...
        pc.ondatachannel = (event) => {
            const dataChannel = event.channel;
            dataChannel.onopen = () => {
                console.log("Data channel opened (receiver)");
                dataChannel.send("Hello back from " + userId);
            };
            dataChannel.onmessage = (event) => {
                console.log("Received:", event.data);
            };
        };

        console.log(`Answering call from ${targetId}`);
        
        await pc.setRemoteDescription(JSON.parse(msg.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        ws.send(JSON.stringify({
            type: "answer", 
            from: userId, 
            to: targetId, 
            sdp: JSON.stringify(answer)
        }));

        // Process accumulated ICE candidates
        for (const candidateJson of pendingIceCandidates) {
            try {
                const candidate = JSON.parse(candidateJson);
                console.log('Processing buffered ICE candidate:', candidate?.type || 'end-of-candidates');
                await pc.addIceCandidate(candidate);
            } catch(e) {
                console.error("Error processing buffered ICE candidate:", e);
            }
        }
        pendingIceCandidates = [];
        
    } catch (err) {
        console.error('Media access error:', err);
        alert('Camera/microphone access required to answer calls!');
    }
}

// Make function global
window.showRTCStats = async function() {
    if (!pc) {
        console.log('No active WebRTC connection');
        alert('No active WebRTC connection');
        return;
    }
    
    console.log('=== WebRTC Statistics ===');
    const stats = await pc.getStats();
    let foundConnection = false;
    let foundDataChannel = false;
    
    stats.forEach(report => {
        if (report.type === 'ice-candidate-pair') {
            console.log('🧊 ICE candidate pair:', {
                state: report.state,
                nominated: report.nominated,
                priority: report.priority
            });
            
            if (report.state === 'succeeded' || report.nominated || report.state === 'in-progress') {
                foundConnection = true;
            }
        }
        
        if (report.type === 'transport') {
            console.log('🔗 Transport info:', {
                state: report.state,
                selectedCandidatePairId: report.selectedCandidatePairId,
                dtlsState: report.dtlsState
            });
            
            if (report.dtlsState === 'connected') {
                foundConnection = true;
            }
        }
        
        if (report.type === 'data-channel') {
            console.log('📡 Data channel:', {
                label: report.label,
                state: report.state,
                messagesReceived: report.messagesReceived,
                messagesSent: report.messagesSent
            });
            
            if (report.state === 'open') {
                foundDataChannel = true;
                foundConnection = true;
            }
        }
    });
    
    console.log('📊 Connection states:', {
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        iceGatheringState: pc.iceGatheringState
    });
    
    if (pc.connectionState === 'connected' || pc.iceConnectionState === 'connected') {
        foundConnection = true;
    }
    
    let message = '';
    if (foundConnection && foundDataChannel) {
        message = '✅ WebRTC connection fully active! Data channel working.';
    } else if (foundConnection) {
        message = '🔄 WebRTC connection established, but data channel not active.';
    } else if (pc.connectionState === 'connecting') {
        message = '🔄 WebRTC connection establishing...';
    } else {
        message = '⚠️ WebRTC connection not found or not active.';
    }
    
    alert(message + ' See details in console.');
    console.log('=== End Statistics ===');
}
