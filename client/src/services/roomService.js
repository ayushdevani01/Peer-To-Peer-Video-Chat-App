const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/rooms`
  : "http://localhost:5000/api/rooms";


export const createRoom = async (roomName, userType, token, guestSession) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (userType === "registered" && token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (userType === "guest" && guestSession) {
    headers["x-guest-session"] = guestSession;
  }

  const response = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers,
    body: JSON.stringify({ roomName }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create room");
  }

  return data.data;
};


export const getMeetingHistory = async (token, limit = 50, offset = 0) => {
  const response = await fetch(
    `${API_URL}/history?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch meeting history");
  }

  return data.data;
};
