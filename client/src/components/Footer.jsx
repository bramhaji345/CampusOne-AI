const Footer = () => {
  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: "240px",
        right: 0,
        height: "60px",
        zIndex: 9999,
        backgroundColor: "white",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          fontSize: "14px",
          color: "#6b7280",
        }}
      >
        <p>
          © 2026 CampusOne AI. All rights reserved.
        </p>

        <div
          style={{
            display: "flex",
            gap: "24px",
          }}
        >
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;