// Minimal dependency-free line chart renderer for exercise history.
function drawLineChart(canvas, points, opts) {
  opts = opts || {};
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || canvas.parentElement.clientWidth || 320;
  const cssHeight = opts.height || 180;

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.height = cssHeight + "px";

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const styles = getComputedStyle(document.body);
  const textDim = styles.getPropertyValue("--text-dim").trim() || "#9aa3b2";
  const accent = styles.getPropertyValue("--accent").trim() || "#3ddc84";
  const border = styles.getPropertyValue("--border").trim() || "#2a2f3a";

  if (!points || points.length === 0) {
    ctx.fillStyle = textDim;
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No history yet", cssWidth / 2, cssHeight / 2);
    return;
  }

  const padding = { top: 16, right: 14, bottom: 26, left: 38 };
  const plotW = cssWidth - padding.left - padding.right;
  const plotH = cssHeight - padding.top - padding.bottom;

  const values = points.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.1;
  min -= pad;
  max += pad;

  const xFor = (i) =>
    padding.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yFor = (v) => padding.top + plotH - ((v - min) / (max - min)) * plotH;

  // gridlines + y labels
  ctx.strokeStyle = border;
  ctx.fillStyle = textDim;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  ctx.lineWidth = 1;
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const v = min + ((max - min) * i) / steps;
    const y = yFor(v);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(cssWidth - padding.right, y);
    ctx.stroke();
    ctx.fillText(Math.round(v * 10) / 10, padding.left - 6, y + 4);
  }

  // line
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = xFor(i);
    const y = yFor(p.value);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // dots
  ctx.fillStyle = accent;
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(xFor(i), yFor(p.value), 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // x labels (first, middle, last)
  ctx.fillStyle = textDim;
  ctx.font = "10.5px sans-serif";
  ctx.textAlign = "center";
  const labelIdxs = new Set([0, points.length - 1, Math.floor((points.length - 1) / 2)]);
  labelIdxs.forEach((i) => {
    if (i < 0 || i >= points.length) return;
    ctx.fillText(points[i].label, xFor(i), cssHeight - 8);
  });
}
