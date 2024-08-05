import React, { useEffect, useState } from "react";
import axios from "axios";

const IssueForm = ({ onSubmit, setShowForm, setTicketDetails, setTicketId, ticketId }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const token = localStorage.getItem("token")

  useEffect(() => {
    if(ticketId){
      onSubmit(formData);
    }
  }, [ticketId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("data", formData);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_CHAT_MICROSERVICE_URL}/tickets/create`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the headers
            "Content-Type": "application/json", // Optional: set content type
          },
        }
      );
      console.log("Response data:", response.data);
      setTicketId(response.data._id);
    } catch (error) {
      console.error("Error occurred while submitting form:", error);
    }
  };

  return (
    <div className="max-w-md mt-8 mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">
        Raise an Issue / Create a Ticket
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            className="flex block text-gray-700 font-bold mb-2"
            htmlFor="name"
          >
            Issue Name
          </label>
          <input
            id="name"
            placeholder="Name of the issue."
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
        </div>
        <div className="mb-4">
          <label
            className="flex block text-gray-700 font-bold mb-2"
            htmlFor="type"
          >
            Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            required
          >
            <option value="" disabled>
              Select issue type
            </option>
            <option value="bug">Bug</option>
            <option value="feature">Feature Request</option>
            <option value="support">Support</option>
          </select>
        </div>
        <div className="mb-4">
          <label
            className="flex block text-gray-700 font-bold mb-2"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            id="description"
            placeholder="Write description about the issue."
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            required
          ></textarea>
        </div>
        <div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200"
          >
            Submit
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="w-full mt-2 bg-gray-500 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring focus:ring-blue-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueForm;
