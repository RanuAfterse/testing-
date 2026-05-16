    <script>
        const apiUrl = 'https://script.google.com/macros/s/AKfycbycjouAW306w0_YshZo2tqb8WNDY20QFEO_MOQy8Jex1S-lKjVbbjjQ1vMfnFWgzWMjSA/exec';
        const ITEMS_PER_PAGE = 10;
        let allData = [];
        let filteredData = [];
        let currentPage = 1;
        let currentFilter = 'all';
        let currentPromptText = '';

        /* ── GENDER DETECTION ── */
        function detectGender(promptText) {
            if (!promptText) return 'random';
            const txt = promptText.toLowerCase();

            // Cek couple dulu (prioritas tertinggi)
            const couplePatterns = [
                /subject\s*:\s*a\s+man\s+and\s+a\s+wom[ae]n/,
                /subject\s*:\s*a\s+wom[ae]n\s+and\s+a\s+man/,
                /subject\s*:\s*couple/,
                /subject\s*:\s*two\s+people/,
                /subject\s*:\s*a\s+boy\s+and\s+a\s+girl/,
                /subject\s*:\s*a\s+girl\s+and\s+a\s+boy/,
            ];
            for (const p of couplePatterns) { if (p.test(txt)) return 'couple'; }

            // Cek wanita
            const femalePatterns = [
                /subject\s*:\s*a\s+wom[ae]n/,
                /subject\s*:\s*a\s+girl/,
                /subject\s*:\s*a\s+female/,
                /subject\s*:\s*she\b/,
                /subject\s*:\s*her\b/,
            ];
            for (const p of femalePatterns) { if (p.test(txt)) return 'wanita'; }

            // Cek pria
            const malePatterns = [
                /subject\s*:\s*a\s+man/,
                /subject\s*:\s*a\s+boy/,
                /subject\s*:\s*a\s+male/,
                /subject\s*:\s*a\s+guy/,
                /subject\s*:\s*he\b/,
                /subject\s*:\s*him\b/,
            ];
            for (const p of malePatterns) { if (p.test(txt)) return 'pria'; }

            return 'random';
        }

        const genderLabel = { wanita: '👩 Wanita', pria: '👨 Pria', couple: '👫 Couple', random: '🎲' };

        fetch(apiUrl)
            .then(r => r.json())
            .then(data => {
                // Tambahkan info gender ke setiap item
                allData = data.map(item => ({
                    ...item,
                    gender: detectGender(item.promptText)
                }));
                filteredData = allData;
                document.getElementById('total-count').textContent = data.length;
                document.getElementById('total-badge').style.display = 'flex';
                document.getElementById('filter-bar').style.display = 'flex';
                const lastPage = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
                renderPage(lastPage);
            })
            .catch(() => {
                document.getElementById('loading').innerHTML = '⚠ Gagal memuat data.<br><small>Cek koneksi atau izin Apps Script.</small>';
            });

        function setFilter(filter) {
            currentFilter = filter;
            // Update tombol aktif
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === filter);
            });
            // Filter data
            filteredData = filter === 'all' ? allData : allData.filter(item => item.gender === filter);
            // Update count badge
            document.getElementById('total-count').textContent = filteredData.length;
            const lastPage = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
            renderPage(lastPage || 1);
        }

        function renderPage(page) {
            currentPage = page;
            const gallery = document.getElementById('gallery');
            gallery.innerHTML = '';

            if (filteredData.length === 0) {
                gallery.innerHTML = `<div id="loading" style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted);font-size:0.8rem;letter-spacing:0.08em;">Tidak ada prompt untuk kategori ini.</div>`;
                renderPagination();
                return;
            }

            const start = (page - 1) * ITEMS_PER_PAGE;
            const pageData = filteredData.slice(start, start + ITEMS_PER_PAGE);

            pageData.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card';
                const tagClass = item.gender || 'random';
                const tagText = genderLabel[tagClass] || '🎲';
                card.innerHTML = `
                    <div class="card-image-wrap">
                        <span class="gender-tag ${tagClass}">${tagText}</span>
                        <img src="${item.imageUrl.replace('?dl=0','?raw=1')}" alt="${item.title}" class="card-image" loading="lazy">
                        <div class="card-overlay">
                            <div class="overlay-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                Lihat Prompt
                            </div>
                        </div>
                    </div>
                    <div class="card-content">
                        <div class="card-title">${item.title}</div>
                        <div class="view-prompt-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            View Prompt
                        </div>
                    </div>
                `;
                card.onclick = () => openModal(item);
                gallery.appendChild(card);
            });

            renderPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function renderPagination() {
            const total = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
            const pg = document.getElementById('pagination');
            pg.innerHTML = '';
            if (total <= 1) return;

            const makeBtn = (label, page, isActive) => {
                const btn = document.createElement('button');
                btn.className = 'page-btn' + (isActive ? ' active' : '');
                btn.innerHTML = label;
                btn.disabled = page < 1 || page > total;
                btn.onclick = () => renderPage(page);
                return btn;
            };

            pg.appendChild(makeBtn('›', currentPage + 1, false));
            for (let i = total; i >= 1; i--) {
                if (total > 7 && Math.abs(i - currentPage) > 2 && i !== 1 && i !== total) {
                    if (i === total - 1 || i === 2) {
                        const dots = document.createElement('span');
                        dots.textContent = '···';
                        dots.style.cssText = 'color:#444;font-size:0.8rem;padding:0 4px;line-height:32px;';
                        pg.appendChild(dots);
                    }
                    continue;
                }
                pg.appendChild(makeBtn(i, i, i === currentPage));
            }
            pg.appendChild(makeBtn('‹', currentPage - 1, false));
        }

        function openModal(item) {
            document.getElementById('modal-img').src = item.imageUrl.replace('?dl=0','?raw=1');
            document.getElementById('modal-title').textContent = item.title;
            document.getElementById('modal-prompt').textContent = item.promptText;
            currentPromptText = item.promptText;
            const btn = document.getElementById('copy-btn');
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Prompt`;
            btn.classList.remove('copied');
            document.getElementById('modal').classList.add('open');
            document.body.style.overflow = 'hidden';
        }

        function closeModal(e) {
            if (e.target === document.getElementById('modal')) closeModalDirect();
        }

        function closeModalDirect() {
            document.getElementById('modal').classList.remove('open');
            document.body.style.overflow = '';
        }

        function doCopy() {
            navigator.clipboard.writeText(currentPromptText).then(() => {
                const btn = document.getElementById('copy-btn');
                btn.innerHTML = '✅ Tersalin!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Prompt`;
                    btn.classList.remove('copied');
                }, 2500);
            });
        }

        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModalDirect(); });
    </script>
