// Contenitore modale riusabile: bottom sheet (default) o dialog centrato.
export default function Sheet({ onClose, center = false, children }) {
  return (
    <div
      className={`sheet-backdrop ${center ? "center" : ""}`}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  );
}
