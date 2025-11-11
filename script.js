// --- 💾 DATABASE LOCALSTORAGE ---
const STORAGE_KEY = 'myGalleryData';
const defaultGalleryData = [
  {
    "id": 1,
    "image": "images/1.jpg",
    "promptText": "Pertahankan wajah sesuaikan dengan gambar ini. sepasang pria muda berambut warna hitam, menggunakan hoodie coklat dengan logo nike kecil disisi kanan hoodie, dan menggunakan dengan celana jeans hitam, memakai jam tangan perpaduan warna hitam dan kuning tembaga dijamnya, menggunakan sepatu nike jordan retro 4 oreo putih hitam coklat. pria tersebut terlihat duduk disamping wanita tersebut dengan ekspresi tersenyum tipis dan wanita muda berhijab coklat muda, mengenakan gaun panjang coklat dan sepatu sneakers putih, tersenyum dan melihat ke arah kamera. dan duduk disamping pria tersebut di meja hitam di sebuah kafe outdoor pada malam hari, dengan pemandangan dibelakang mereka kota yang penuh cahaya di latar belakang. Di mejanya ada minuman, piring berisi makanan penutup, ponsel, dan kunci mobil. Suasana hangat dan modern."
  }
];

// Fungsi untuk MEMBACA data dari localStorage
function getGalleryData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try { 
            const parsedData = JSON.parse(savedData);
            return Array.isArray(parsedData) ? parsedData : defaultGalleryData;
        } 
        catch (e) { 
            return defaultGalleryData; 
        }
    } else {
        return defaultGalleryData;
    }
}

// Fungsi untuk MENYIMPAN data ke localStorage
function saveGalleryData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Perbarui data global kita setelah menyimpan
    galleryData = data;
}

// --- 🌟 State Aplikasi ---
let galleryData = []; // Data utama kita, diisi saat load
let currentPage = 1;
const itemsPerPage = 9; // Ubah ini untuk jumlah item per halaman
let currentSort = 'newest'; // 'newest' atau 'oldest'
let currentView = 'grid'; // 'grid' atau 'list'


// --- 🎨 FUNGSI GALERI UTAMA ---
function loadGallery() {
    // 0. Terapkan mode tampilan
    document.body.classList.toggle('list-view', currentView === 'list');
    
    // Perbarui tombol aktif
    document.getElementById('grid-view-btn').classList.toggle('active', currentView === 'grid');
    document.getElementById('list-view-btn').classList.toggle('active', currentView === 'list');

    const container = document.querySelector('.gallery-container');
    container.innerHTML = ''; 
    
    // 1. Ambil data yang relevan (berdasarkan pencarian)
    const searchQuery = document.getElementById('search-bar').value.toLowerCase().trim();
    let filteredData = galleryData.filter(item => 
        item.promptText.toLowerCase().includes(searchQuery)
    );

    // 2. Sortir data
    filteredData.sort((a, b) => {
        return (currentSort === 'newest') ? b.id - a.id : a.id - b.id;
    });

    // 3. Paginasi data
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToRender = filteredData.slice(startIndex, endIndex);
    
    // 4. Render item ke halaman
    itemsToRender.forEach(item => {
        const imageUrl = item.image.startsWith('data:image') 
            ? item.image 
            : item.image; 

        const galleryItemHTML = `
            <div class="gallery-item" data-id="${item.id}">
                <img src="${imageUrl}" alt="Gambar AI ${item.id}">
                <div class="prompt-description">
                    <p><strong>Prompt ${item.id}:</strong></p>
                    <p class="prompt-text">
                        ${item.promptText}
                    </p>
                    <button class="copy-btn">Salin Prompt</button>
                    
                    <div class="item-actions">
                        <button class="detail-btn">Detail</button>
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Hapus</button>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', galleryItemHTML);
    });
    
    // 5. Render kontrol paginasi
    renderPagination(filteredData.length);
}

// --- Fungsi untuk Render Tombol Paginasi ---
function renderPagination(totalItems) {
    const paginationContainer = document.getElementById('pagination-controls');
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return; // Tidak perlu paginasi jika hanya 1 halaman

    // Tombol "Sebelumnya"
    const prevButton = document.createElement('button');
    prevButton.textContent = '«';
    prevButton.disabled = (currentPage === 1);
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadGallery();
        }
    });
    paginationContainer.appendChild(prevButton);

    // Tombol Halaman
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            currentPage = i;
            loadGallery();
        });
        paginationContainer.appendChild(pageButton);
    }
    
    // Tombol "Berikutnya"
    const nextButton = document.createElement('button');
    nextButton.textContent = '»';
    nextButton.disabled = (currentPage === totalPages);
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadGallery();
        }
    });
    paginationContainer.appendChild(nextButton);
}


// --- Fungsi Import / Export Data ---
function exportData() {
    const dataString = JSON.stringify(galleryData, null, 2);
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gallery_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Data berhasil diekspor!'); // NOTIFIKASI
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData) && importedData.every(item => item.id && item.promptText && item.image)) {
                if (confirm('Ini akan menimpa semua data galeri Anda saat ini. Lanjutkan?')) {
                    saveGalleryData(importedData);
                    currentPage = 1; // Reset ke halaman pertama
                    loadGallery();
                    showNotification('Data berhasil diimpor!'); // NOTIFIKASI
                }
            } else {
                showNotification('File JSON tidak valid atau tidak sesuai format galeri.', 'error'); // NOTIFIKASI
            }
        } catch (error) {
            showNotification('Gagal membaca file. Pastikan file JSON valid.', 'error'); // NOTIFIKASI
            console.error('Import error:', error);
        }
        // Reset input file agar bisa import file yang sama lagi
        event.target.value = null;
    };
    reader.readAsText(file);
}


// --- Fungsi Helper untuk Base64 ---
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// --- Fungsi Notifikasi Toast (Versi 2.0) ---
function showNotification(message, type = 'success') {
    // 1. Buat Elemen Utama
    const notification = document.createElement('div');
    notification.className = 'notification';
    if (type === 'error') {
        notification.classList.add('error');
    }

    // 2. Buat Ikon
    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    icon.textContent = (type === 'success') ? '✔️' : '❌';

    // 3. Buat Teks Pesan
    const msg = document.createElement('span');
    msg.className = 'notification-message';
    msg.textContent = message;

    // 4. Buat Tombol Close
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close-btn';
    closeBtn.innerHTML = '&times;'; // &times; adalah kode HTML untuk simbol 'X'

    // 5. Tambahkan Event Listener ke Tombol Close
    closeBtn.addEventListener('click', () => {
        // Memicu animasi keluar secara manual
        notification.style.animation = 'slideOutToRight 0.4s ease-in forwards';
        
        // Hapus elemen dari DOM setelah animasi selesai (400ms)
        setTimeout(() => {
            notification.remove();
        }, 400);
    });

    // 6. Gabungkan semua elemen
    notification.appendChild(icon);
    notification.appendChild(msg);
    notification.appendChild(closeBtn);

    // 7. Tampilkan ke halaman
    document.body.appendChild(notification);

    // 8. Atur auto-remove setelah animasi selesai
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3400); 
}


// --- 🚀 INISIALISASI HALAMAN ---
document.addEventListener('DOMContentLoaded', () => {

    // Ambil data dari localStorage saat halaman dimuat
    galleryData = getGalleryData();
    // Ambil preferensi tampilan
    currentView = localStorage.getItem('galleryViewMode') || 'grid';
    
    // 1. Muat galeri secara dinamis
    loadGallery();

    // 2. Ambil elemen-elemen statis
    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('modal-image');
    const modalPrompt = document.getElementById('modal-prompt');
    const closeModalBtn = document.querySelector('#lightbox-modal .close-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    const galleryContainer = document.querySelector('.gallery-container');
    const addPromptBtn = document.getElementById('add-prompt-btn');
    const addModal = document.getElementById('add-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeAddModalBtn = document.getElementById('close-add-modal');
    const cancelAddBtn = document.getElementById('cancel-add-btn');
    const addPromptForm = document.getElementById('add-prompt-form');
    const promptImageInput = document.getElementById('prompt-image');
    const promptTextInput = document.getElementById('prompt-text-input');
    const editPromptIdInput = document.getElementById('edit-prompt-id');
    const detailModal = document.getElementById('detail-modal');
    const closeDetailModalBtn = document.getElementById('close-detail-modal');
    const detailModalImage = document.getElementById('detail-modal-image');
    const detailModalPrompt = document.getElementById('detail-modal-prompt');
    const detailCopyBtn = document.getElementById('detail-copy-btn');
    const detailGeminiBtn = document.getElementById('detail-gemini-btn');
    const detailChatGptBtn = document.getElementById('detail-chatgpt-btn');
    const searchBar = document.getElementById('search-bar');
    const sortSelect = document.getElementById('sort-select');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');


    // --- Listener untuk Kontrol Galeri ---
    searchBar.addEventListener('input', () => {
        currentPage = 1; 
        loadGallery();
    });
    
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        currentPage = 1; 
        loadGallery();
    });

    gridViewBtn.addEventListener('click', () => {
        currentView = 'grid';
        localStorage.setItem('galleryViewMode', 'grid');
        loadGallery();
    });

    listViewBtn.addEventListener('click', () => {
        currentView = 'list';
        localStorage.setItem('galleryViewMode', 'list');
        loadGallery();
    });
    
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);


    // --- Fungsi Buka/Tutup Modal Tambah ---
    const openAddModal = () => { 
        modalTitle.textContent = 'Tambah Prompt Baru'; 
        editPromptIdInput.value = ''; 
        addPromptForm.reset(); 
        promptImageInput.required = true;
        addModal.style.display = 'block'; 
    };
    const closeAddModal = () => {
        addModal.style.display = 'none';
        addPromptForm.reset(); 
    };
    addPromptBtn.addEventListener('click', openAddModal);
    closeAddModalBtn.addEventListener('click', closeAddModal);
    cancelAddBtn.addEventListener('click', closeAddModal);
    addModal.addEventListener('click', (e) => {
        if (e.target === addModal) { closeAddModal(); }
    });

    // --- Fungsi Buka/Tutup Modal Detail ---
    const closeDetailModal = () => {
        detailModal.style.display = 'none';
    };
    closeDetailModalBtn.addEventListener('click', closeDetailModal);
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) { closeDetailModal(); }
    });

    // --- Fungsi Buka/Tutup Modal Konfirmasi Hapus ---
    const closeConfirmModal = () => {
        confirmModal.style.display = 'none';
        delete confirmYesBtn.dataset.deleteId; 
    };
    confirmNoBtn.addEventListener('click', closeConfirmModal);
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) { closeConfirmModal(); }
    });


    // --- Logika Submit Form (Tambah & Edit) ---
    addPromptForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const saveButton = addPromptForm.querySelector('.btn-save');
        saveButton.disabled = true;
        saveButton.textContent = 'Menyimpan...';

        try {
            const text = promptTextInput.value.trim();
            const editId = editPromptIdInput.value; 
            const file = promptImageInput.files[0];
            let currentData = getGalleryData(); 

            if (editId) {
                // LOGIKA EDIT
                const itemIndex = currentData.findIndex(item => item.id == parseInt(editId));
                if (itemIndex === -1) throw new Error('Item tidak ditemukan');
                
                if (file) {
                    currentData[itemIndex].image = await toBase64(file);
                }
                currentData[itemIndex].promptText = text;
                saveGalleryData(currentData); 
                showNotification('Prompt berhasil diperbarui!');

            } else {
                // LOGIKA TAMBAH
                if (!file) {
                    showNotification('Anda harus memilih file gambar!', 'error');
                    throw new Error('Tidak ada file dipilih');
                }
                const imageBase64 = await toBase64(file); 
                const newPrompt = {
                    id: Date.now(), 
                    image: imageBase64,
                    promptText: text
                };
                currentData.push(newPrompt);
                saveGalleryData(currentData);
                showNotification('Prompt baru berhasil ditambahkan!');
                
                currentPage = 1;
                currentSort = 'newest';
                sortSelect.value = 'newest';
            }

            loadGallery(); 
            closeAddModal(); 

        } catch (error) {
            console.error('Gagal menyimpan:', error);
            if (error.message !== 'Tidak ada file dipilih') {
                showNotification('Gagal menyimpan prompt. Silakan coba lagi.', 'error');
            }
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Simpan';
        }
    });

    // --- Logika untuk Tombol Aksi di Modal Detail ---
    detailCopyBtn.addEventListener('click', () => {
        const promptText = detailModalPrompt.textContent;
        navigator.clipboard.writeText(promptText).then(() => {
            const originalText = detailCopyBtn.textContent;
            detailCopyBtn.textContent = 'Tersalin!';
            detailCopyBtn.classList.add('copied');
            setTimeout(() => {
                detailCopyBtn.textContent = originalText;
                detailCopyBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Gagal menyalin:', err);
            showNotification('Gagal menyalin ke clipboard.', 'error');
        });
    });

    detailGeminiBtn.addEventListener('click', () => {
        const promptText = detailModalPrompt.textContent;
        const encodedPrompt = encodeURIComponent(promptText);
        window.open(`https://gemini.google.com/app? q=${encodedPrompt}`, '_blank');
    });

    detailChatGptBtn.addEventListener('click', () => {
        const promptText = detailModalPrompt.textContent;
        navigator.clipboard.writeText(promptText).then(() => {
            showNotification('Prompt disalin! Silakan paste di ChatGPT.', 'success');
            window.open('https://chat.openai.com/', '_blank');
        }).catch(err => {
            console.error('Gagal menyalin:', err);
            showNotification('Gagal menyalin, buka ChatGPT secara manual.', 'error');
            window.open('https://chat.openai.com/', '_blank');
        });
    });
    

    // --- FITUR Event Delegation (Salin, Lightbox, Edit, Detail, Hapus) ---
    galleryContainer.addEventListener('click', (e) => {
        const clickedElement = e.target;
        const itemEl = clickedElement.closest('.gallery-item');
        if (!itemEl) return; 

        const id = parseInt(itemEl.dataset.id);
        const itemData = galleryData.find(item => item.id === id);
        if (!itemData) return;

        // Aksi 1: Tombol Salin
        if (clickedElement.classList.contains('copy-btn')) {
            navigator.clipboard.writeText(itemData.promptText).then(() => {
                const originalText = clickedElement.textContent;
                clickedElement.textContent = 'Tersalin!';
                clickedElement.classList.add('copied');
                setTimeout(() => {
                    clickedElement.textContent = originalText;
                    clickedElement.classList.remove('copied');
                }, 2000);
            }).catch(err => console.error('Gagal menyalin:', err));
        }

        // Aksi 2: Gambar Lightbox (Zoom) - Hanya di mode Grid
        if (clickedElement.tagName === 'IMG' && !document.body.classList.contains('list-view')) {
            modal.style.display = 'block';
            modalImg.src = clickedElement.src;
            modalPrompt.textContent = itemData.promptText;
        }

        // Aksi 3: Tombol Edit
        if (clickedElement.classList.contains('edit-btn')) {
            modalTitle.textContent = 'Edit Prompt';
            editPromptIdInput.value = itemData.id;
            promptImageInput.required = false; 
            promptTextInput.value = itemData.promptText;
            addModal.style.display = 'block';
        }

        // Aksi 4: Tombol Detail
        if (clickedElement.classList.contains('detail-btn')) {
            detailModalImage.src = itemEl.querySelector('img').src;
            detailModalPrompt.textContent = itemData.promptText;
            detailModal.style.display = 'block';
        }
        
        // Aksi 5: Tombol Hapus (Menampilkan modal konfirmasi)
        if (clickedElement.classList.contains('delete-btn')) {
            confirmMessage.textContent = `Anda yakin ingin menghapus prompt ${itemData.id}?\n\n"${itemData.promptText.substring(0, 50)}..."`;
            confirmYesBtn.dataset.deleteId = itemData.id;
            confirmModal.style.display = 'block';
        }
    });
    
    // --- Listener untuk Tombol Konfirmasi Hapus ---
    confirmYesBtn.addEventListener('click', () => {
        const idToDelete = parseInt(confirmYesBtn.dataset.deleteId);
        if (!idToDelete) return; 

        let currentData = getGalleryData();
        currentData = currentData.filter(item => item.id !== idToDelete);
        saveGalleryData(currentData);
        showNotification('Prompt berhasil dihapus.'); 
        
        // Cek jika halaman saat ini jadi kosong
        const totalItems = currentData.filter(item => item.promptText.toLowerCase().includes(searchBar.value.toLowerCase().trim())).length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        
        loadGallery(); 
        closeConfirmModal(); 
    });


    // --- Fungsi tutup modal Lightbox ---
    const closeModal = () => { modal.style.display = 'none'; }
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) { closeModal(); }
    });

    // --- FITUR TEMA (Siklus 3 Tema) ---
    const applyTheme = (theme) => {
        body.classList.remove('dark-mode', 'nature-mode');
        
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            darkModeToggle.textContent = '🌙';
            darkModeToggle.title = 'Ganti Tema (Mode Gelap)';
        } else if (theme === 'nature') {
            body.classList.add('nature-mode');
            darkModeToggle.textContent = '🍃';
            darkModeToggle.title = 'Ganti Tema (Mode Alam)';
        } else {
            // 'light' adalah default
            darkModeToggle.textContent = '☀️';
            darkModeToggle.title = 'Ganti Tema (Mode Terang)';
        }
    };
    
    // Muat tema yang tersimpan
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Event listener untuk memutar siklus tema
    darkModeToggle.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        let newTheme;

        if (currentTheme === 'light') {
            newTheme = 'dark';
        } else if (currentTheme === 'dark') {
            newTheme = 'nature';
        } else {
            // Jika 'nature', kembali ke 'light'
            newTheme = 'light';
        }
        
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });

});