import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "../CSS/CustomerChat.css";
import logo from "../assets/logo.png";
import Message from "./Message";
import Auth from "./Auth";
import ChatList from "./ChatList";
import Draggable from "react-draggable";
import axios from "axios";

const socket = io("http://localhost:8000");

const ChatWindow = () => {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [attachmentType, setAttachmentType] = useState(null);
  const [view, setView] = useState("chatList"); // 'chatList' or 'message'
  const [token, setToken] = useState(null);
  const [ticketDetails, setTicketDetails] = useState({});
  const [customerDetails, setCustomerDetails] = useState(null);
  const [ticketId, setTicketId] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const clickStartTime = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const handleStart = () => {
    isDragging.current = true;
    clickStartTime.current = Date.now(); // Record the start time
  };

  const handleStop = (e, data) => {
    setPosition({ x: data.x, y: data.y });
    isDragging.current = false;

    // Check if the drag duration is short to consider it as a click
    const clickDuration = Date.now() - clickStartTime.current;
    if (clickDuration < 200) {
      // Adjust the duration threshold as needed
      setIsOpen(true);
    }
  };

  console.log({ conversations });
  console.log({ selectedConversation });

  useEffect(() => {
    const fetchConversations = async () => {
      if (!customerDetails) return;
      try {
        const customerId = customerDetails._id; // Access customer ID from props

        // Make the API request to fetch conversations for the customer
        const response = await axios.get(
          `${process.env.REACT_APP_CHAT_MICROSERVICE_URL}/conversations/${customerId}`
        );

        // Update the state with the fetched conversations
        setConversations(response.data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    // Fetch conversations when component mounts or customerDetails changes
    fetchConversations();
  }, [customerDetails]);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    setCustomerDetails(JSON.parse(localStorage.getItem("customerDetails")));
  }, []);

  useEffect(() => {
    // Listen for the 'message' event
    socket.on("message", (message) => {
      console.log("Received new message:", message);

      setConversations((prevConversations) => {
        return prevConversations.map((conversation) => {
          if (conversation.roomId === message.room) {
            // Update the messages in the selected conversation
            return {
              ...conversation,
              messages: [...conversation.messages, message],
            };
          }
          return conversation;
        });
      });

      if (selectedConversation && message.room === selectedConversation.roomId) {
        setSelectedConversation((prevSelectedConversation) => ({
          ...prevSelectedConversation,
          messages: [...prevSelectedConversation.messages, message],
        }));
      }
    });

    socket.on("ticketStatusUpdated", (response) => {
      console.log("Ticket status changed to: ", response.status);

      setConversations((prevConversations) => {
        return prevConversations.map((conversation) => {
          if (conversation.roomId === response.roomId) {
            // Update the status of the ticketId in the selected conversation
            return {
              ...conversation,
              ticketId: {
                ...conversation.ticketId,
                status: response.status
              }
            };
          }
          return conversation;
        });
      });

      if (selectedConversation && response.roomId === selectedConversation.roomId) {
        setSelectedConversation((prevSelectedConversation) => ({
          ...prevSelectedConversation,
          ticketId:{
            ...prevSelectedConversation.ticketId,
            status: response.status
          }
        }));
      }

    })

    // Clean up the socket listener on unmount
    return () => {
      socket.off("message");
      socket.off("ticketStatusUpdated");
    };
  }, [selectedConversation]);

  useEffect(() => {
    console.log("Connecting to socket...");

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    // Emit all roomIds to join
    const roomIds = conversations.map((conversation) => conversation.roomId);
    socket.emit("join", roomIds);

    return () => {
      console.log("Cleaning up socket listeners...");
    };
  }, [selectedConversation]);

  useEffect(() => {
    if (attachment) {
      sendMessage();
    }
  }, [attachment]);

  const sendMessage = () => {
    if (message.trim() || attachment) {
      const msg = {
        room: selectedConversation.roomId,
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
    socket.emit("createRoom", roomId, ticketId, customerId, (response) => {
      if (response.success) {
        setConversations((prevConversations) => [
          ...prevConversations,
          response.conversation,
        ]);
      }
      console.log("assigned room: ", response.conversation);
    });
    setTicketId(null);
  };

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
                setTicketId={setTicketId}
                ticketId={ticketId}
                setSelectedConversation={setSelectedConversation}
                setView={setView}
                createNewChat={createNewChat}
                conversations={conversations}
              />
            ) : (
              <Message
                selectedConversation={selectedConversation}
                setSelectedConversation={setSelectedConversation}
                setConversations={setConversations}
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
          <div className="chat-toggle-icon">
            <img src={logo} alt="Chat" draggable="false" />
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default ChatWindow;
