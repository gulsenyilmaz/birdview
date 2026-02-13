
interface LoadingOverlayProps {
    text?: string;
  
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
      text = "Loading..."
    }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.35)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(20,20,20,0.85)",
          color: "white",
          fontSize: 14,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default LoadingOverlay;
