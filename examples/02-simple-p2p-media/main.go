package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

// Message represents a signaling message
type Message struct {
	// Message type. Possible values: "register", "call", "answer", "ice"
	Type string `json:"type"`
	// User IDs and payload
	From string `json:"from,omitempty"`
	// Target user ID for "call", "answer", "ice" message types
	To string `json:"to,omitempty"`
	// SDP for "call" and "answer" message types
	SDP string `json:"sdp,omitempty"`
	// ICE candidate for "ice" message type
	Candidate string `json:"candidate,omitempty"`
}

// upgrader is used to upgrade HTTP connections to WebSocket connections
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// clients is global storage for connected clients
var clients = make(map[string]*websocket.Conn)

// wsHandler handles WebSocket connections and signaling messages
func wsHandler(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	// Define userID outside the loop to track disconnections
	var userID string

	for {
		// Read message from WebSocket
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("Read message error:", err)
			if userID != "" {
				delete(clients, userID)
				fmt.Printf("User %s disconnected\n", userID)
			}
			break
		}

		// Parse JSON message
		var msg Message
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			fmt.Println("JSON unmarshal error:", err)
			continue
		}

		// Handle message based on its type
		switch msg.Type {
		case "register":
			// Register user
			userID = msg.From
			clients[userID] = conn
			fmt.Printf("User %s registered\n", userID)
		case "call":
			// Forward call offer to the target user
			fmt.Printf("Call from %s to %s\n", msg.From, msg.To)
			if target, ok := clients[msg.To]; ok {
				target.WriteJSON(msg)
			} else {
				fmt.Printf("User %s not found\n", msg.To)
			}
		case "answer":
			// Forward call answer to the caller
			fmt.Printf("Answer from %s to %s\n", msg.From, msg.To)
			if target, ok := clients[msg.To]; ok {
				target.WriteJSON(msg)
			}
		case "ice":
			// Forward ICE candidate to the target user
			fmt.Printf("ICE candidate from %s to %s\n", msg.From, msg.To)
			if target, ok := clients[msg.To]; ok {
				target.WriteJSON(msg)
			}
		}
	}
}

func main() {
	// Serve static files from the "ui" directory
	http.Handle("/", http.FileServer(http.Dir("./ui")))
	// WebSocket endpoint
	http.HandleFunc("/ws", wsHandler)
	// Start the server
	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}
