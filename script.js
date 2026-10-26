const form = document.getElementById("presensiForm");
const namaWebinar = document.getElementById("namaWebinar");
const tanggal = document.getElementById("tanggal");
const nama = document.getElementById("nama");
const sekolah = document.getElementById("sekolah");

const canvas = document.getElementById("signatureCanvas");
const ctx = canvas.getContext("2d");

const hapusTTD = document.getElementById("hapusTTD");
const daftarPresensi = document.getElementById("daftarPresensi");
const pencarian = document.getElementById("pencarian");
const jumlahPeserta = document.getElementById("jumlahPeserta");

const STORAGE_KEY = "dataPresensiWebinar";
let sedangMenggambar = false;
let sudahTandaTangan = false;

// Mengatur tanggal hari ini
function tanggalHariIni() {
    const sekarang = new Date();
    const tahun = sekarang.getFullYear();
    const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
    const hari = String(sekarang.getDate()).padStart(2, "0");

    return `${tahun}-${bulan}-${hari}`;
}

tanggal.value = tanggalHariIni();

// Mengatur ukuran area tanda tangan
function aturCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#222";
}

aturCanvas();

function posisiPointer(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

// Mulai menggambar tanda tangan
canvas.addEventListener("pointerdown", function(event) {
    event.preventDefault();
    sedangMenggambar = true;

    const posisi = posisiPointer(event);

    ctx.beginPath();
    ctx.moveTo(posisi.x, posisi.y);
    ctx.lineTo(posisi.x + 0.1, posisi.y + 0.1);
    ctx.stroke();

    sudahTandaTangan = true;
    canvas.setPointerCapture(event.pointerId);
});

// Menggambar garis tanda tangan
canvas.addEventListener("pointermove", function(event) {
    if (!sedangMenggambar) return;

    event.preventDefault();

    const posisi = posisiPointer(event);
    ctx.lineTo(posisi.x, posisi.y);
    ctx.stroke();

    sudahTandaTangan = true;
});

// Berhenti menggambar
function berhentiMenggambar() {
    sedangMenggambar = false;
    ctx.beginPath();
}

canvas.addEventListener("pointerup", berhentiMenggambar);
canvas.addEventListener("pointercancel", berhentiMenggambar);
canvas.addEventListener("lostpointercapture", berhentiMenggambar);

// Menghapus tanda tangan
hapusTTD.addEventListener("click", function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sudahTandaTangan = false;
    ctx.beginPath();
});

// Mengambil data dari LocalStorage
function ambilData() {
    try {
        const data = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

// Menyimpan data presensi
form.addEventListener("submit", function(event) {
    event.preventDefault();

    if (!sudahTandaTangan) {
        alert("Silakan bubuhkan tanda tangan terlebih dahulu.");
        return;
    }

    const data = ambilData();

    const peserta = {
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        namaWebinar: namaWebinar.value.trim(),
        tanggal: tanggal.value,
        nama: nama.value.trim(),
        sekolah: sekolah.value.trim(),
        tandaTangan: canvas.toDataURL("image/png")
    };

    data.push(peserta);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        alert("Data gagal disimpan. Penyimpanan browser mungkin penuh.");
        return;
    }

    alert("Presensi berhasil disimpan!");

    form.reset();
    tanggal.value = tanggalHariIni();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sudahTandaTangan = false;

    tampilkanPresensi();
});

// Membuat elemen tabel dengan aman
function buatSel(teks) {
    const td = document.createElement("td");
    td.textContent = teks;
    return td;
}

// Menampilkan daftar peserta
function tampilkanPresensi() {
    const data = ambilData();
    const kataKunci = pencarian.value.trim().toLowerCase();

    const hasil = data.filter(function(peserta) {
        return (
            peserta.nama.toLowerCase().includes(kataKunci) ||
            peserta.sekolah.toLowerCase().includes(kataKunci)
        );
    });

    daftarPresensi.replaceChildren();

    hasil.forEach(function(peserta, index) {
        const baris = document.createElement("tr");

        baris.appendChild(buatSel(index + 1));
        baris.appendChild(buatSel(peserta.nama));
        baris.appendChild(buatSel(peserta.sekolah));
        baris.appendChild(buatSel(peserta.tanggal));

        const selTTD = document.createElement("td");
        const gambar = document.createElement("img");

        gambar.src = peserta.tandaTangan;
        gambar.alt = "Tanda tangan " + peserta.nama;
        gambar.className = "signature-image";

        selTTD.appendChild(gambar);
        baris.appendChild(selTTD);

        const selAksi = document.createElement("td");
        const tombolHapus = document.createElement("button");

        tombolHapus.textContent = "Hapus";
        tombolHapus.className = "btn-delete";

        tombolHapus.addEventListener("click", function() {
            const yakin = confirm(
                "Hapus presensi " + peserta.nama + "?"
            );

            if (!yakin) return;

            const dataTerbaru = ambilData().filter(function(item) {
                return item.id !== peserta.id;
            });

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(dataTerbaru)
            );

            tampilkanPresensi();
        });

        selAksi.appendChild(tombolHapus);
        baris.appendChild(selAksi);

        daftarPresensi.appendChild(baris);
    });

    jumlahPeserta.textContent =
        "Total peserta: " + data.length;
}

// Fitur pencarian
pencarian.addEventListener("input", tampilkanPresensi);

// Menampilkan data yang sudah tersimpan saat halaman dibuka
tampilkanPresensi();
