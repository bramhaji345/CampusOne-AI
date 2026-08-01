import React, { useState } from "react";
import "./Notifications.css";
import NotificationCard from "./NotificationCard";
import notificationData from "./NotificationData";

const Notifications = () => {
  const [notifications, setNotifications] = useState(notificationData);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // Mark notification as read
  const handleRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

  // Delete notification
  const handleDelete = (id) => {
    setNotifications((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  // Unread count
  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  // Filter + Search
  const filteredNotifications = notifications.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.message.toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;

    switch (filter) {
      case "Unread":
        matchesFilter = !item.read;
        break;

      case "Important":
        matchesFilter = item.important;
        break;

      case "Today":
        matchesFilter = item.date === "Today";
        break;

      case "This Week":
        matchesFilter =
          item.date === "This Week" ||
          item.date === "2 Days Ago" ||
          item.date === "3 Days Ago";
        break;

      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="notifications-page">

      <div className="notification-top">

        <h1>
          🔔 Notifications
        </h1>

        <div className="unread-box">
          Unread : {unreadCount}
        </div>

      </div>

      <input
        type="text"
        placeholder="Search notifications..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-box"
      />

      <div className="filter-buttons">

        <button
          onClick={() => setFilter("All")}
          className={filter === "All" ? "active" : ""}
        >
          All
        </button>

        <button
          onClick={() => setFilter("Unread")}
          className={filter === "Unread" ? "active" : ""}
        >
          Unread
        </button>

        <button
          onClick={() => setFilter("Important")}
          className={filter === "Important" ? "active" : ""}
        >
          Important
        </button>

        <button
          onClick={() => setFilter("Today")}
          className={filter === "Today" ? "active" : ""}
        >
          Today
        </button>

        <button
          onClick={() => setFilter("This Week")}
          className={filter === "This Week" ? "active" : ""}
        >
          This Week
        </button>

      </div>

      <div className="notification-list">

        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onRead={handleRead}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <h2 className="no-data">
            No Notifications Found
          </h2>
        )}

      </div>

    </div>
  );
};

export default Notifications;