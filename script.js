
const $ = id => document.getElementById(id);

let attendance = JSON.parse(localStorage.getItem("attendance")) || [];
let praktikum = JSON.parse(localStorage.getItem("praktikum")) || [];

const today = new Date().toISOString().slice(0,10);

$("attendanceDate").value = today;
$("praktikumDate").value = today;

// SIMPAN DATA
function saveData() {
  localStorage.setItem("attendance", JSON.stringify(attendance));
  localStorage.setItem("praktikum", JSON.stringify(praktikum));
}

// AMANKAN TEKS
function safe(text) {
  return String(text ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#39;"
  }[c]));
}

// STATISTIK
function updateStats() {
  ["Hadir","Izin","Sakit","Alpa"].forEach(status => {
    $("stat"+status).textContent =
      attendance.filter(x => x.status === status).length;
  });
}

// ABSENSI HARIAN
function renderAttendance() {
  const search = $("searchAttendance").value.toLowerCase();
  const date = $("filterDate").value;

  const data = attendance.filter(x =>
    (x.name.toLowerCase().includes(search) ||
     x.className.toLowerCase().includes(search)) &&
    (!date || x.date === date)
  );

  $("attendanceTable").innerHTML = data.length
    ? data.map((x,i) => `
      <tr>
        <td>${i+1}</td>
        <td>${safe(x.name)}</td>
        <td>${safe(x.className)}</td>
        <td>${safe(x.date)}</td>
        <td><span class="status status-${x.status}">${x.status}</span></td>
        <td>${safe(x.note || "-")}</td>
        <td><button class="delete-btn" data-id="${x.id}">Hapus</button></td>
      </tr>
    `).join("")
    : `<tr><td colspan="7">Belum ada data.</td></tr>`;
}

// TAMBAH ABSENSI
$("attendanceForm").addEventListener("submit", e => {
  e.preventDefault();

  attendance.unshift({
    id: Date.now().toString(),
    name: $("studentName").value.trim(),
    className: $("studentClass").value.trim(),
    date: $("attendanceDate").value,
    status: $("attendanceStatus").value,
    note: $("attendanceNote").value.trim()
  });

  saveData();
  renderAttendance();
  updateStats();

  e.target.reset();
  $("attendanceDate").value = today;
});

// HAPUS ABSENSI
$("attendanceTable").addEventListener("click", e => {
  const id = e.target.dataset.id;

  if(id && confirm("Hapus data absensi?")) {
    attendance = attendance.filter(x => x.id !== id);
    saveData();
    renderAttendance();
    updateStats();
  }
});

// SEARCH
$("searchAttendance").addEventListener("input",renderAttendance);
$("filterDate").addEventListener("change",renderAttendance);

$("clearDate").addEventListener("click",()=>{
  $("filterDate").value="";
  renderAttendance();
});

// TAB
document.querySelectorAll(".tab").forEach(tab=>{
  tab.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(t=>
      t.classList.toggle("active",t===tab)
    );

    $("absensi").classList.toggle("hidden",tab.dataset.tab!=="absensi");
    $("praktikum").classList.toggle("hidden",tab.dataset.tab!=="praktikum");
  });
});

/* =========================
   TANDA TANGAN DIGITAL
========================= */

const canvas = $("signatureCanvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let signed = false;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) return;

  const dpr = window.devicePixelRatio || 1;

  // Simpan gambar lama jika sudah ada
  const oldImage = signed ? canvas.toDataURL("image/png") : null;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#172554";

  // Kembalikan gambar lama
  if (oldImage) {
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };

    img.src = oldImage;
  }
}

function getPosition(e) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// MULAI TANDA TANGAN
canvas.addEventListener("pointerdown", e => {
  e.preventDefault();

  drawing = true;
  signed = true;

  canvas.setPointerCapture(e.pointerId);

  const p = getPosition(e);

  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
});

// GAMBAR TANDA TANGAN
canvas.addEventListener("pointermove", e => {
  if (!drawing) return;

  e.preventDefault();

  const p = getPosition(e);

  ctx.lineTo(p.x, p.y);
  ctx.stroke();
});

// SELESAI TANDA TANGAN
canvas.addEventListener("pointerup", e => {
  drawing = false;

  if (canvas.hasPointerCapture(e.pointerId)) {
    canvas.releasePointerCapture(e.pointerId);
  }
});

canvas.addEventListener("pointercancel", () => {
  drawing = false;
});

// HAPUS TTD
function clearSignature() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  signed = false;
}

$("clearSignature").addEventListener("click", clearSignature);

// Resize layar
window.addEventListener("resize", resizeCanvas);

// Saat tab praktikum dibuka
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab === "praktikum") {
      setTimeout(resizeCanvas, 100);
    }
  });
});

setTimeout(resizeCanvas, 300);

// SIMPAN PRAKTIKUM
$("praktikumForm").addEventListener("submit",e=>{
  e.preventDefault();

  if(!signed){
    alert("Silakan isi tanda tangan terlebih dahulu!");
    return;
  }

  praktikum.unshift({
    id:Date.now().toString(),
    name:$("praktikumName").value.trim(),
    className:$("praktikumClass").value.trim(),
    mapel:$("praktikumMapel").value.trim(),
    title:$("praktikumTitle").value.trim(),
    date:$("praktikumDate").value,
    status:$("praktikumStatus").value,
    signature:canvas.toDataURL("image/png")
  });

  saveData();
  renderPraktikum();

  e.target.reset();
  $("praktikumDate").value=today;
  clearSignature();
});

// TAMPILKAN PRAKTIKUM
function renderPraktikum(){
  const search=$("searchPraktikum").value.toLowerCase();

  const data=praktikum.filter(x=>
    x.name.toLowerCase().includes(search) ||
    x.title.toLowerCase().includes(search) ||
    x.mapel.toLowerCase().includes(search)
  );

  $("praktikumTable").innerHTML=data.length
    ?data.map((x,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${safe(x.name)}</td>
        <td>${safe(x.className)}</td>
        <td>${safe(x.mapel)}</td>
        <td>${safe(x.title)}</td>
        <td>${safe(x.date)}</td>
        <td><span class="status status-${x.status}">${x.status}</span></td>
        <td><img class="webinar-sign" src="${x.signature}"></td>
        <td><button class="delete-btn" data-id="${x.id}">Hapus</button></td>
      </tr>
    `).join("")
    :`<tr><td colspan="9">Belum ada data praktikum.</td></tr>`;
}

// HAPUS PRAKTIKUM
$("praktikumTable").addEventListener("click",e=>{
  const id=e.target.dataset.id;

  if(id && confirm("Hapus data praktikum?")){
    praktikum=praktikum.filter(x=>x.id!==id);
    saveData();
    renderPraktikum();
  }
});

$("searchPraktikum").addEventListener("input",renderPraktikum);

// EXPORT EXCEL
function exportExcel(data,filename){
  if(!data.length){
    alert("Tidak ada data untuk diekspor!");
    return;
  }

  const ws=XLSX.utils.json_to_sheet(data);
  const wb=XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb,ws,"Data");
  XLSX.writeFile(wb,filename);
}

$("exportAttendanceExcel").addEventListener("click",()=>{
  exportExcel(attendance.map((x,i)=>({
    No:i+1,
    "Nama Siswa":x.name,
    Kelas:x.className,
    Tanggal:x.date,
    Status:x.status,
    Keterangan:x.note
  })),"Absensi_Siswa.xlsx");
});

$("exportPraktikumExcel").addEventListener("click",()=>{
  exportExcel(praktikum.map((x,i)=>({
    No:i+1,
    "Nama Siswa":x.name,
    Kelas:x.className,
    "Mata Pelajaran":x.mapel,
    Praktikum:x.title,
    Tanggal:x.date,
    Status:x.status,
    TTD:"Tersimpan"
  })),"Presensi_Praktikum.xlsx");
});

// EXPORT PDF
function exportPDF(title,headers,rows,filename){
  if(!rows.length){
    alert("Tidak ada data untuk diekspor!");
    return;
  }

  const {jsPDF}=window.jspdf;
  const doc=new jsPDF("landscape");

  doc.setFontSize(16);
  doc.text(title,14,16);

  doc.autoTable({
    head:[headers],
    body:rows,
    startY:25,
    styles:{fontSize:8},
    headStyles:{fillColor:[79,70,229]}
  });

  doc.save(filename);
}

$("exportAttendancePdf").addEventListener("click",()=>{
  exportPDF(
    "Rekap Absensi Harian",
    ["No","Nama Siswa","Kelas","Tanggal","Status","Keterangan"],
    attendance.map((x,i)=>[
      i+1,x.name,x.className,x.date,x.status,x.note||"-"
    ]),
    "Absensi_Siswa.pdf"
  );
});

$("exportPraktikumPdf").addEventListener("click",()=>{
  exportPDF(
    "Rekap Presensi Praktikum",
    ["No","Nama Siswa","Kelas","Mapel","Praktikum","Tanggal","Status","TTD"],
    praktikum.map((x,i)=>[
      i+1,x.name,x.className,x.mapel,x.title,
      x.date,x.status,x.signature?"Ada":"-"
    ]),
    "Presensi_Praktikum.pdf"
  );
});

// JALANKAN
renderAttendance();
renderPraktikum();
updateStats();
