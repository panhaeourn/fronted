export default function CitoReceiptPrint() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Print Receipt</h1>
      <button onClick={() => window.print()}>
        Print / Save as PDF
      </button>
    </div>
  );
}