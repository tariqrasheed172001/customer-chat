import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "../CSS/CustomerChat.css";
import logo from "../assets/logo.png";
import Message from "./Message";
import Auth from "./Auth";
import ChatList from "./ChatList";
import Draggable from "react-draggable";

const socket = io("http://localhost:8000");

const ChatWindow = () => {
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [attachmentType, setAttachmentType] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [view, setView] = useState("chatList"); // 'chatList' or 'message'
  const [token, setToken] = useState(null);
  const [ticketDetails, setTicketDetails] = useState({});
  const [customerDetails, setCustomerDetails] = useState(null);
  const [ticketId, setTicketId] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const clickStartTime = useRef(null);

  const handleStart = () => {
    isDragging.current = true;
    clickStartTime.current = Date.now(); // Record the start time
  };

  const handleStop = (e, data) => {
    setPosition({ x: data.x, y: data.y });
    isDragging.current = false;

    // Check if the drag duration is short to consider it as a click
    const clickDuration = Date.now() - clickStartTime.current;
    if (clickDuration < 200) { // Adjust the duration threshold as needed
      setIsOpen(true);
    }
  };

  
  useEffect(() => {
    setToken(localStorage.getItem("token"));
    setCustomerDetails(localStorage.getItem("customerDetails"));
  }, []);

  useEffect(() => {
    console.log("Connecting to socket...");

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("join");
    });

    socket.on("message", (message) => {
      console.log("Received new message:", message);
      setMessages((prevMessages) => ({
        ...prevMessages,
        [message.room]: [...(prevMessages[message.room] || []), message],
      }));
    });

    return () => {
      console.log("Cleaning up socket listeners...");
      socket.off("assignedRoom");
      socket.off("message");
    };
  }, []);

  useEffect(() => {
    if (attachment) {
      sendMessage();
    }
  }, [attachment]);

  const sendMessage = () => {
    if (message.trim() || attachment) {
      const msg = {
        room: currentChat.roomId,
        sender: "Customer",
        message,
        attachment,
        attachmentType,
      };
      console.log("Sending message:", msg);
      socket.emit("message", msg);
      setMessage("");
      setAttachment(null);
    }
  };

  const createNewChat = async () => {
    // Generate a new unique room ID (you can use a better method for unique IDs)
    console.log("new chat clicked");
    const roomId = `Room-${new Date().getTime()}`;
    const customerId = customerDetails._id;
    console.log("ticketId", ticketId);
    socket.emit("createRoom", roomId, ticketId, customerId, (assignedRoom) => {
      setCurrentChat(assignedRoom);
      console.log("assigned room: ", assignedRoom);
      setChats((prevChats) => [...prevChats, { assignedRoom }]);
    });
    setTicketId(null);
  };

  console.log("currentCHat", currentChat);
  console.log("chats: ", chats);

  return (
    <div className="chat-container">
      <div className={`chat-widget ${isOpen ? "open" : ""}`}>
        {isOpen && (
          <button
            className="close-button z-50"
            onClick={() => setIsOpen(false)}
          >
            <span>✖️</span>
          </button>
        )}
        {token === null ? (
          <Auth
            isOpen={isOpen}
            setToken={setToken}
            setCustomerDetails={setCustomerDetails}
          />
        ) : (
          <>
            {view === "chatList" ? (
              <ChatList
                setTicketDetails={setTicketDetails}
                ticketDetails={ticketDetails}
                chats={chats}
                setTicketId={setTicketId}
                ticketId={ticketId}
                currentChat={currentChat}
                setCurrentChat={(chatId) => {
                  setCurrentChat(chatId);
                  setView("message");
                }}
                createNewChat={createNewChat}
              />
            ) : (
              <Message
                currentChat={currentChat}
                setCurrentChat={setCurrentChat}
                setChats={setChats}
                messages={messages[currentChat.roomId] || []}
                setMessage={setMessage}
                message={message}
                setAttachment={setAttachment}
                setAttachmentType={setAttachmentType}
                attachmentType={attachmentType}
                isOpen={isOpen}
                sendMessage={sendMessage}
                goBack={() => setView("chatList")} // Add goBack prop
              />
            )}
          </>
        )}
      </div>
      {!isOpen && (
        <Draggable
          position={position}
          onStart={handleStart}
          onStop={handleStop}
        >
          <div
            className="chat-toggle-icon"
          >
            <img src={logo} alt="Chat" draggable="false" />
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default ChatWindow;
