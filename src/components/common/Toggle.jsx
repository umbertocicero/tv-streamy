export default function Toggle({ on, onChange }) {
  return (
    <button className={`toggle ${on ? "on" : ""}`} onClick={onChange}>
      <span className="knob"></span>
    </button>
  );
}
