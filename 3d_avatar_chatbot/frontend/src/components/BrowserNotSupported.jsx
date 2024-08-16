export function BrowserNotSupported() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#000",
        color: "#fff",
      }}
    >
      <h1 style={{ fontSize: "3rem", textAlign: "center" }}>
        This application only supports Chrome and Safari.
      </h1>
    </div>
  );
}
