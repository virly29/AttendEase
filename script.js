
const formSiswa = document.getElementById("formSiswa");
const formAbsensi = document.getElementById("formAbsensi");

const namaSiswa = document.getElementById("namaSiswa");
const pilihSiswa = document.getElementById("pilihSiswa");
const tanggal = document.getElementById("tanggal");
const status = document.getElementById("status");
const daftarAbsensi = document.getElementById("daftarAbsensi");

let siswa = JSON.parse(localStorage.getItem("siswa")) || [];
let absensi = JSON.parse(localStorage.getItem("absensi")) || [];

tanggal.value = new Date().toLocaleDateString("en-CA");

function simpanData() {
    localStorage.setItem("siswa", JSON.stringify(siswa));
    localStorage.setItem("absensi", JSON.stringify(absensi));
}

function tampilkanSiswa() {
    pilihSiswa.innerHTML =
        '<option value="">Pilih nama siswa</option>';

    siswa.forEach(function(nama) {
        const pilihan = document.createElement("option");
        pilihan.value = nama;
        pilihan.textContent = nama;
        pilihSiswa.appendChild(pilihan);
    });
}

formSiswa.addEventListener("submit", function(event) {
    event.preventDefault();

    const nama = namaSiswa.value.trim();

    if (nama === "") {
        alert("Nama siswa harus diisi!");
        return;
    }

    if (siswa.some(s => s.toLowerCase() === nama.toLowerCase())) {
        alert("Nama siswa sudah terdaftar!");
        return;
    }

    siswa.push(nama);
    simpanData();
    tampilkanSiswa();

    namaSiswa.value = "";
    alert("Siswa berhasil ditambahkan!");
});

formAbsensi.addEventListener("submit", function(event) {
    event.preventDefault();

    const nama = pilihSiswa.value;
    const tgl = tanggal.value;
    const st = status.value;

    if (!nama || !tgl) {
        alert("Silakan lengkapi data absensi!");
        return;
    }

    const sudahAda = absensi.some(function(data) {
        return data.nama === nama && data.tanggal === tgl;
    });

    if (sudahAda) {
        alert("Absensi siswa pada tanggal ini sudah ada!");
        return;
    }

    absensi.push({
        nama: nama,
        tanggal: tgl,
        status: st
    });

    simpanData();
    tampilkanAbsensi();

    alert("Absensi berhasil disimpan!");
});

function tampilkanAbsensi() {
    daftarAbsensi.innerHTML = "";

    absensi.forEach(function(data) {
        const baris = document.createElement("tr");

        const kolomNama = document.createElement("td");
        kolomNama.textContent = data.nama;

        const kolomTanggal = document.createElement("td");
        kolomTanggal.textContent = data.tanggal;

        const kolomStatus = document.createElement("td");
        kolomStatus.textContent = data.status;

        baris.appendChild(kolomNama);
        baris.appendChild(kolomTanggal);
        baris.appendChild(kolomStatus);

        daftarAbsensi.appendChild(baris);
    });
}

tampilkanSiswa();
tampilkanAbsensi();