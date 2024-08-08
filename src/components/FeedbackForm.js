import React, { useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:8000");

const FeedbackForm = ({
  selectedConversation,
  setSelectedConversation,
  setConversations,
}) => {
  const [rating, setRating] = useState("");
  const [resolved, setResolved] = useState("");
  const [comments, setComments] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const feedbackData = { rating, resolved, comments };
    const ticketId = selectedConversation.ticketId._id;
    const roomId = selectedConversation.roomId;

    // Emit the closeTicket event with feedback data and ticket ID
    socket.emit(
      "closeTicket",
      { ticketId, roomId, feedback: feedbackData },
      (response) => {
        if (response.success) {
          console.log("Ticket closed successfully:", response);
          // Update the status in the current chat

          setConversations((prevConversations) => {
            return prevConversations.map((conversation) => {
              if (conversation.roomId === roomId) {
                // Update the status of the ticketId in the selected conversation
                return {
                  ...conversation,
                  ticketId: {
                    ...conversation.ticketId,
                    status: 'closed'
                  }
                };
              }
              return conversation;
            });
          });
    
          if (selectedConversation && roomId === selectedConversation.roomId) {
            setSelectedConversation((prevSelectedConversation) => ({
              ...prevSelectedConversation,
              ticketId:{
                ...prevSelectedConversation.ticketId,
                status: 'closed'
              }
            }));
          }

        } else {
          console.error("Error closing ticket:", response.message);
          // Handle error (e.g., show an error message)
        }
      }
    );

    // Reset form
    setRating("");
    setResolved("");
    setComments("");
  };

  const handleReopen = () => {
    const newStatus = "open";
    const ticketId = selectedConversation.ticketId._id;
    const roomId =  selectedConversation.roomId;

    socket.emit(
      "updateTicketStatus",
      {
        ticketId,
        status: newStatus,
        roomId: roomId,
      },
      (response) => {
        if (response.success) {
          console.log("Ticket status updated successfully.", response);

          setConversations((prevConversations) => {
            return prevConversations.map((conversation) => {
              if (conversation.roomId === roomId) {
                // Update the status of the ticketId in the selected conversation
                return {
                  ...conversation,
                  ticketId: {
                    ...conversation.ticketId,
                    status: newStatus
                  }
                };
              }
              return conversation;
            });
          });
    
          if (selectedConversation && roomId === selectedConversation.roomId) {
            setSelectedConversation((prevSelectedConversation) => ({
              ...prevSelectedConversation,
              ticketId:{
                ...prevSelectedConversation.ticketId,
                status: newStatus
              }
            }));
          }

        } else {
          console.error("Error updating ticket status:", response.message);
        }
      }
    );

    // Reset form
    setRating("");
    setResolved("");
    setComments("");
  };

  return (
    <div className="w-2/3 items-center ml-20 mt-10 justify-center bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Feedback</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="flex block text-gray-700 text-sm font-bold mb-0">
            How did Tariq did for you today?
          </label>
          <p className="text-xs flex mb-2">(Click an icon below)</p>
          <div className="flex space-x-2">
            {["😁", "😊", "😐", "😞", "😡"].map((emoji, index) => (
              <label
                key={index}
                className={`flex items-center cursor-pointer ${
                  rating === (5 - index).toString()
                    ? "bg-blue-400 rounded-full p-0.5"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="rating"
                  value={5 - index}
                  checked={rating === (5 - index).toString()}
                  onChange={(e) => setRating(e.target.value)}
                  className="hidden"
                  required
                />
                <span
                  className={`text-5xl ${
                    rating === (5 - index).toString()
                      ? "text-blue-500"
                      : "text-gray-700"
                  }`}
                >
                  {emoji}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="flex block text-gray-700 text-sm font-bold mb-2">
            Was your issue resolved?
          </label>
          <div className="flex">
            <label className="flex mr-4">
              <input
                type="radio"
                value="Yes"
                checked={resolved === "Yes"}
                onChange={(e) => setResolved(e.target.value)}
                className="mr-1"
                required
              />
              Yes
            </label>
            <label className="flex">
              <input
                type="radio"
                value="No"
                checked={resolved === "No"}
                onChange={(e) => setResolved(e.target.value)}
                className="mr-1"
                required
              />
              No
            </label>
          </div>
        </div>
        <div className="mb-5">
          <label className="flex block text-gray-700 text-sm font-bold mb-2">
            Comments
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="2"
            required
          />
        </div>
        <div className="flex items-center justify-between">
          {resolved === "Yes" ? (
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleReopen}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Reopen ticket
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
