"use client";

export function ScaleHonestyDiagram({
  farmAreaHa = 2.0,
}: {
  farmAreaHa?: number | null;
}) {
  const ha = Math.max(0.5, farmAreaHa ?? 2.0);
  const hlsPixels = Math.max(1, Math.round(ha / 0.09));
  const smapRatio = Math.max(1, Math.round(8100 / ha));

  return (
    <div className="rounded-[24px] border border-[#E2E4E9] bg-white p-5 shadow-[0_6px_14px_rgba(17,24,39,0.06)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-[#52525B] uppercase">
            RESOLUTION FOOTPRINT
          </p>
          <h3 className="font-display text-base font-bold text-[#171717]">
            Scale Honesty Picture
          </h3>
        </div>
        <span className="text-xs font-semibold text-[#7A6200]">
          1 SMAP px ≈ {smapRatio.toLocaleString()} farms
        </span>
      </div>

      {/* Concentric Boxes: SMAP 9 km -> DEM 90 m -> HLS/iSDAsoil 30 m -> Farm Parcel */}
      <div className="rounded-2xl border-2 border-dashed border-[#F9D601] bg-[#FFF9D6]/40 p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-[#7A6200]">
          <span>SMAP / IMERG Regional Box</span>
          <span>9–10 km · 8,100 ha</span>
        </div>

        <div className="rounded-xl border border-[#1FB26B]/60 bg-[#EAF7EF]/60 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-[#166534]">
            <span>Copernicus DEM Terrain</span>
            <span>90 m · 0.81 ha</span>
          </div>

          <div className="rounded-xl border-2 border-[#3670FF] bg-[#EBF1FF] p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-[#1E4CE0]">
              <span>NASA HLS + iSDAsoil v2</span>
              <span>30 m · 0.09 ha</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#3670FF]/40 bg-white px-3 py-2.5">
              <div>
                <p className="text-xs font-bold text-[#171717]">
                  Your Farm Parcel
                </p>
                <p className="text-[11px] text-[#52525B]">
                  {ha.toFixed(1)} ha · Direct 30 m field match
                </p>
              </div>
              <span className="rounded-full bg-[#171717] px-2.5 py-1 font-mono text-[11px] font-bold text-white">
                ~{hlsPixels} HLS px
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#52525B]">
        Your <strong className="text-[#171717]">{ha.toFixed(1)} ha</strong> plot
        is resolved by <strong className="text-[#1E4CE0]">~{hlsPixels} pixels</strong>{" "}
        at 30 m (HLS/iSDAsoil), whereas a single{" "}
        <strong className="text-[#7A6200]">9 km SMAP box</strong> spans regional
        moisture across {smapRatio.toLocaleString()} similar farms.
      </p>
    </div>
  );
}
