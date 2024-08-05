import React, { useEffect, useState } from "react";
import { Bars3BottomRightIcon, XMarkIcon } from "@heroicons/react/24/outline"; // Import Tailwind CSS Icons
import IssueForm from "./IssueForm";

const ChatList = ({
  chats,
  currentChat,
  setCurrentChat,
  createNewChat,
  setTicketDetails,
  ticketDetail,
  setTicketId,
  ticketId,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const status = localStorage.getItem('filterStatus');
    if(status)
      setStatusFilter(status);
  },[])

  const handleCreateNewChat = () => {
    setShowForm(true);
  };

  const handleFormSubmit = (formData) => {
    // Simulate creating a new chat/ticket
    const newChat = { id: `Room ${chats.length + 1}`, ...formData };
    createNewChat(newChat);
    setShowForm(false);
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    localStorage.setItem("filterStatus", status)
    setShowFilter(false);
  };

  const filteredChats = chats.filter((chat) => {
    if (statusFilter === "All") return true;
    return chat.assignedRoom.ticketDetails.status === statusFilter;
  });

  const getStatusCounts = () => {
    const counts = { All: chats.length, open: 0, closed: 0, resolved: 0 };
    chats.forEach((chat) => {
      const status = chat.assignedRoom.ticketDetails.status;
      if (status in counts) {
        counts[status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="chat-list bg-white shadow-md rounded-lg p-4 w-full flex flex-col h-full relative">
      {showForm ? (
        <IssueForm
          onSubmit={handleFormSubmit}
          setShowForm={setShowForm}
          setTicketDetails={setTicketDetails}
          ticketId={ticketId}
          setTicketId={setTicketId}
        />
      ) : (
        <>
          <div className="flex flex-col flex-shrink-0">
            <div className="flex items-center p-1 mt-0 border-b border-gray-200">
              <div className="ml-32 items-center">
                <p className="text-xl font-medium">Your DexKor Assistant</p>
                <p className="text-green-500 ml-2">Online</p>
              </div>
            </div>
            <div className="flex">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Your Tickets:{" "}
                <span
                  className={`${
                    statusFilter === "open" && "text-green-500"
                  } ${statusFilter === "resolved" && "text-yellow-500"} ${
                    statusFilter === "closed" && "text-red-500"
                  } ${statusFilter === "All" && "text-blue-500"}`}
                >
                  {statusFilter}
                </span>
              </h2>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="ml-auto mb-3 bg-gray-200 text-gray-600 rounded-full p-2 hover:bg-gray-300"
              >
                {showFilter ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3BottomRightIcon className="w-6 h-6" />
                )}
              </button>
            </div>
            {showFilter && (
              <div className="bg-gray-100 p-2 rounded-md shadow-md absolute top-32 right-0 w-2/4 z-10">
                <p className="font-medium">Filter by status</p>
                <ul className="space-y-1">
                  {["All", "open", "resolved", "closed"].map((status) => (
                    <li
                      key={status}
                      className={`cursor-pointer p-1 rounded-md ${
                        statusFilter === status
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-200"
                      }`}
                      onClick={() => handleFilterChange(status)}
                    >
                      {status} ({statusCounts[status]})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <hr className="h-0.5  bg-gray-300 mb-2"></hr>
          <div className="flex-1 overflow-y-auto">
            <ul className="space-y-2">
              {filteredChats.map((chat, index) => (
                <li
                  key={index}
                  className={`flex cursor-pointer p-2 rounded-md transition-colors duration-200 ${
                    currentChat === chat.assignedRoom.roomId
                      ? "bg-blue-500 text-black"
                      : "bg-gray-400 hover:bg-gray-500 text-white"
                  }`}
                  onClick={() => setCurrentChat(chat.assignedRoom)}
                >
                  <p className="flex-1">
                    {chat.assignedRoom?.ticketDetails?.ticketNumber}
                  </p>
                  <p className="ml-auto mr-12">
                    {chat.assignedRoom.ticketDetails.status}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={handleCreateNewChat}
            className="new-chat-button mt-4 bg-blue-500 text-white py-2 px-4 rounded-md shadow hover:bg-blue-600 transition-colors duration-200 flex-shrink-0"
          >
            Create new ticket
          </button>
        </>
      )}
    </div>
  );
};

export default ChatList;
