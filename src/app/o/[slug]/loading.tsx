/** Paparan segera semasa halaman dimuatkan. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Memuatkan" className="grid gap-4">
      <div className="skel" style={{ height: 40, width: "45%" }} />
      <div className="skel" style={{ height: 18, width: "70%" }} />
      <div className="skel" style={{ height: 160 }} />
      <div className="skel" style={{ height: 160 }} />
    </div>
  );
}
