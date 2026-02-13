
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
        background: "rgba(252, 252, 252, 0.35)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgb(206, 201, 201)",
          color: "rgba(38, 38, 38)",
          fontSize: 14,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default LoadingOverlay;
