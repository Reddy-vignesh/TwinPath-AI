export default function PageLoader({ text = "Syncing Digital Twin..." }: { text?: string }) {
  return (
    <div className="page-loader-overlay">
      <div className="star-loader-container">
        <div className="preloader">
          <div className="crack crack1" />
          <div className="crack crack2" />
          <div className="crack crack3" />
          <div className="crack crack4" />
          <div className="crack crack5" />
        </div>
      </div>
      {text && <p className="page-loader-text">{text}</p>}
    </div>
  );
}
