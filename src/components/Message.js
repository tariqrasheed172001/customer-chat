import React, { useRef, useState } from "react";
import {
  PaperClipIcon,
  PaperAirplaneIcon,
  CameraIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import io from "socket.io-client";
import { RiSpeakLine } from "react-icons/ri";
import html2canvas from "html2canvas";
import FeedbackForm from "./FeedbackForm";

const socket = io("http://localhost:8000");

const Message = ({
  messages,
  setMessage,
  message,
  setAttachment,
  setAttachmentType,
  sendMessage,
  isOpen,
  goBack,
  currentChat,
  setCurrentChat,
  setChats,
}) => {
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recognitionRef = useRef(null);
  const [status, setStatus] = useState(currentChat.ticketDetails.status);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result);
        setAttachmentType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  console.log("currentCkajdf:", currentChat);

  const handleIconClick = () => {
    fileInputRef.current.click();
  };

  const captureScreenshot = async () => {
    try {
      const content = document.getElementById("main-content");
      const chatWindow = document.querySelector(".chat-widget");

      if (!content) {
        console.error("Main content not found!");
        return;
      }

      if (chatWindow) {
        chatWindow.style.display = "none";
      }

      const canvas = await html2canvas(content);
      const screenshot = canvas.toDataURL("image/png");

      if (chatWindow) {
        chatWindow.style.display = "";
      }

      setAttachment(screenshot);
      setAttachmentType("image/png");
    } catch (error) {
      console.error("Error capturing screenshot:", error);
    }
  };

  const startScreenRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "video/webm; codecs=vp9",
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "video/webm" });
        const reader = new FileReader();
        let result;
        reader.onloadend = () => {
          setAttachment(reader.result);
          setAttachmentType("video/webm");
        };
        reader.readAsDataURL(blob);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();

      setTimeout(() => {
        mediaRecorderRef.current.stop();
        stream.getTracks().forEach((track) => track.stop());
      }, 8000); // Stop recording after 8 seconds
    } catch (error) {
      console.error("Error starting screen recording:", error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachment(reader.result);
          setAttachmentType("audio/webm");
        };
        reader.readAsDataURL(blob);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Error starting audio recording:", error);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const startTranscription = () => {
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Speech recognition is not supported in this browser.");
      return;
    }

    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    let finalTranscript = "";

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setMessage(finalTranscript + interimTranscript);
    };

    recognitionRef.current.start();
    setTranscribing(true);
  };

  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setTranscribing(false);
    }
  };

  const renderAttachment = (attachment, attachmentType) => {
    const handlePreview = () => {
      window.open(attachment, "_blank");
    };

    if (attachmentType.includes("image")) {
      return (
        <img
          src={attachment}
          alt="attachment"
          className="w-22 max-w-xs rounded-lg"
        />
      );
    } else if (attachmentType.includes("video")) {
      return (
        <video src={attachment} controls className="w-22 max-w-xs rounded-lg" />
      );
    } else if (attachmentType.includes("audio")) {
      return <audio src={attachment} controls />;
    } else {
      return (
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreview}
            className="bg-transparent hover:bg-transparent hover:text-black px-3 py-1 rounded"
          >
            Attachment preview
          </button>
        </div>
      );
    }
  };

  const handleStatusChange = (event) => {
    const newStatus = event.target.value;
    const ticketId = currentChat.ticketDetails._id;
    const roomId = currentChat.roomId;

    socket.emit(
      "updateTicketStatus",
      {
        ticketId,
        status: newStatus,
      },
      (response) => {
        if (response.success) {
          console.log("Ticket status updated successfully.", response);

          // Update the status in the current chat
          setStatus(newStatus);
          setCurrentChat((prev) => ({
            ...prev,
            ticketDetails: {
              ...prev.ticketDetails,
              status: newStatus,
            },
          }));

          // Update the status in the chats array
          console.log("roomId", roomId);
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.assignedRoom.roomId === roomId
                ? {
                    ...chat,
                    assignedRoom: {
                      ...chat.assignedRoom,
                      ticketDetails: {
                        ...chat.assignedRoom.ticketDetails,
                        status: newStatus,
                      },
                    },
                  }
                : chat
            )
          );
        } else {
          console.error("Error updating ticket status:", response.message);
        }
      }
    );
  };

  return (
    <>
      {isOpen && (
        <div className="flex flex-col h-full bg-white mb-0 rounded-lg shadow-md">
          <div className="flex items-center justify-center">
            <button
              onClick={goBack}
              className="back-button bg-gray-300 hover:bg-gray-400 p-2 rounded-md m-2"
            >
              <ArrowUturnLeftIcon className="h-5" />
            </button>{" "}
            <p>ID: {currentChat.ticketDetails.ticketNumber}</p>
          </div>
          <div className="flex items-center justify-center cursor-pointer">
            <p className="text-3xl">
              Status:{" "}
              {status === "closed" && (
                <span className="text-2xl text-red-500">Closed</span>
              )}{" "}
            </p>
            {status !== "closed" && (
              <select
                id="status-select"
                value={status}
                onChange={handleStatusChange}
                className={`ml-2 mt-2 ${status === "open" ? "border-green-500" : "border-yellow-500"}  border-2 cursor-pointer rounded-md shadow-lg`}
              >
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </select>
            )}
          </div>
          <hr className="mt-4 h-0.5 bg-gray-300"></hr>
          {status === "resolved" && (
            <FeedbackForm
              ticketId={currentChat.ticketDetails._id}
              setCurrentChat={setCurrentChat}
              currentChat={currentChat}
              setStatus={setStatus}
              setChats={setChats}
              roomId={currentChat.roomId}
            />
          )}
          {(status === "open" || status === "closed") && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-${
                    msg.sender === "Customer" ? "end" : "start"
                  } ${msg.sender === "Customer" ? "justify-end" : ""}`}
                >
                  {msg.sender !== "Customer" && (
                    <img
                      src="https://i.pinimg.com/474x/5c/90/91/5c90918460c19210ac39858555a46af6.jpg"
                      alt="Customer Avatar"
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  )}
                  <div className="block">
                  {msg.attachment && (
                    <div
                      className={`${
                        msg.sender === "Customer"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      } p-1 ${
                        msg.attachmentType.includes("audio")
                          ? "rounded-full"
                          : "rounded-lg"
                      } mb-1 `}
                    >
                      {renderAttachment(msg.attachment, msg.attachmentType)}
                    </div>
                  )}
                  {msg.message && (
                    <div
                      className={`bg-${
                        msg.sender === "Customer" ? "blue-500" : "green-500"
                      } p-2 rounded-lg ${
                        msg.sender === "Customer"
                          ? "text-white"
                          : "text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  )}
                  </div>
                  {msg.sender === "Customer" && (
                    <img
                      src="https://pbs.twimg.com/profile_images/1707101905111990272/Z66vixO-_normal.jpg"
                      alt="Customer Avatar"
                      className="w-8 h-8 rounded-full ml-3"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          {status === "open" && (
            <div className="p-1 border-t border-gray-200">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 py-2 px-3 rounded-full bg-gray-100 focus:outline-none relative"
                />
                <div className="absolute right-52 top-1/2 transform -translate-y-1/2 flex items-center">
                  <button
                    className={`bg-white pl-2 text-gray-500 ${
                      transcribing
                        ? "hover:text-red-500"
                        : "hover:text-gray-700"
                    } ${transcribing ? "text-red-500" : ""}`}
                    onMouseDown={startTranscription}
                    onMouseUp={stopTranscription}
                  >
                    <RiSpeakLine className="h-6 w-6" />
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleIconClick}
                  className="text-gray-500 hover:text-gray-700 ml-3"
                >
                  <PaperClipIcon className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={captureScreenshot}
                  className="text-gray-500 hover:text-gray-700 ml-3"
                >
                  <CameraIcon className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => startScreenRecording()}
                  className="text-gray-500 hover:text-gray-700 ml-3"
                >
                  <VideoCameraIcon className="h-6 w-6" />
                </button>
                <button
                  className={`text-gray-500 ${
                    recording ? "hover:text-green-500" : "hover:text-gray-700"
                  } ml-3 ${recording ? "text-green-500" : ""}`}
                  onClick={recording ? stopRecording : startRecording}
                >
                  <MicrophoneIcon
                    className={`h-6 w-6 ${
                      recording ? "animate-pulse" : "text-gray-500"
                    }`}
                  />
                </button>
                <button
                  className="bg-blue-500 text-white p-2 rounded-full ml-3 hover:bg-blue-600"
                  onClick={sendMessage}
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Message;
