import React from "react";
import "./Notifications.css";

const NotificationCard = ({
  notification,
  onRead,
  onDelete,
}) => {
  const getTypeClass = (type) => {
    switch (type) {
      case "success":
        return "success";
      case "urgent":
        return "urgent";
      case "warning":
        return "warning";
      default:
        return "general";
    }
  };

  return (
    <div
      className={`notification-card ${getTypeClass(
        notification.type
      )} ${notification.read ? "read" : "unread"}`}
    >
      <div className="notification-header">
        <div>
          <h3>{notification.title}</h3>

          <span className="category">
            {notification.category}
          </span>
        </div>

        {notification.important && (
          <span className="important">⭐ Important</span>
        )}
      </div>

      <p className="message">{notification.message}</p>

      <div className="notification-footer">
        <small>
          {notification.date} • {notification.time}
        </small>

        <div className="buttons">
          {!notification.read && (
            <button
              className="read-btn"
              onClick={() => onRead(notification.id)}
            >
              ✓ Mark as Read
            </button>
          )}

          <button
            className="view-btn"
            onClick={() =>
              alert(
                `${notification.title}\n\n${notification.message}`
              )
            }
          >
            View
          </button>

          <button
            className="delete-btn"
            onClick={() => onDelete(notification.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;