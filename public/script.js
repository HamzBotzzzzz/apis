
    // Script untuk toggle sidebar dan navigasi konten
    const toggleBtn = document.getElementById('toggleSidebar');
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    const navLinks = document.querySelectorAll('.sidebar nav a');
    const portfolioContent = document.getElementById('portfolioContent');
    const gameapiContent = document.getElementById('gameapiContent');
    const apidocsContent = document.getElementById('apidocsContent');
    const creditContent = document.getElementById('creditContent');

    // Toggle sidebar
    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('sidebar-open');
        sidebar.classList.toggle('show');
    });

    // Navigasi konten
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Sembunyikan semua konten
            portfolioContent.style.display = 'none';
            gameapiContent.style.display = 'none';
            apidocsContent.style.display = 'none';
            creditContent.style.display = 'none';

            // Tampilkan sesuai pilihan
            const contentType = link.getAttribute('data-content');
            if (contentType === 'portfolio') {
                portfolioContent.style.display = 'block';
            } else if (contentType === 'gameapi') {
                gameapiContent.style.display = 'block';
            } else if (contentType === 'apidocs') {
                apidocsContent.style.display = 'block';
            } else if (contentType === 'credit') {
                creditContent.style.display = 'block';
            }

            // Tutup sidebar di mobile
            if (window.innerWidth <= 576) {
                body.classList.remove('sidebar-open');
                sidebar.classList.remove('show');
            }
        });
    });

    // SCRIPT MUSIC PLAYER DENGAN AUDIO UNLOCK SYSTEM
    document.addEventListener('DOMContentLoaded', function () {
        const animatedElements = document.querySelectorAll('.profile-info, .links-container, .music-section');

        animatedElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
                if (index === animatedElements.length - 1) {
                    setTimeout(() => {
                        initAudioUnlock();
                    }, 300);
                }
            }, 200 + (index * 200));
        });

        const socialLinks = document.querySelectorAll('.social-link');
        socialLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(0, 149, 246, 0.4);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    pointer-events: none;
                `;
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });

        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        const audioPlayer = document.getElementById('audioPlayer');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const playIcon = document.getElementById('playIcon');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const progressBar = document.getElementById('progressBar');
        const progress = document.getElementById('progress');
        const currentTime = document.getElementById('currentTime');
        const duration = document.getElementById('duration');
        const currentTrack = document.getElementById('currentTrack');
        const currentArtist = document.getElementById('currentArtist');
        const trackList = document.getElementById('trackList');
        const playlistCount = document.getElementById('playlistCount');

        let currentTrackIndex = 0;
        let isPlaying = false;
        let playlist = [];
        let audioUnlocked = false;

        // Fungsi unlock audio
        function initAudioUnlock() {
            const unlockAudio = () => {
                if (audioUnlocked) return;
                audioPlayer.volume = 0;
                audioPlayer.play().then(() => {
                    audioPlayer.pause();
                    audioPlayer.volume = 1;
                    audioUnlocked = true;
                    console.log("✅ Audio unlocked successfully!");
                }).catch(() => {
                    try {
                        const AudioContext = window.AudioContext || window.webkitAudioContext;
                        const ctx = new AudioContext();
                        const oscillator = ctx.createOscillator();
                        const gainNode = ctx.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(ctx.destination);
                        gainNode.gain.value = 0;
                        oscillator.start();
                        setTimeout(() => {
                            oscillator.stop();
                            audioUnlocked = true;
                            console.log("✅ Audio unlocked via AudioContext!");
                        }, 100);
                    } catch (error) {
                        console.log("❌ Audio unlock failed:", error);
                    }
                });
            };
            ['click', 'scroll', 'touchstart', 'mousemove', 'keydown'].forEach(event => {
                document.addEventListener(event, () => {
                    if (!audioUnlocked) {
                        console.log(`🔓 Unlocking audio via ${event}...`);
                        unlockAudio();
                    }
                }, { once: true });
            });
            setTimeout(() => {
                if (!audioUnlocked) {
                    console.log("🕒 Auto-unlock attempt...");
                    initAudioUnlock();
                }
            }, 1000);
        }

        // Load playlist dan preload semua track
        function loadSpotifyPlaylist() {
            playlist = [
                {
                    name: "Kangen",
                    artist: "Dewa 19",
                    path: "https://files.catbox.moe/xj6uyb.mp3",
                    image: "https://files.catbox.moe/yfjane.jpg"
                },
                {
                    name: "Kangen",
                    artist: "Dewa 19", 
                    path: "https://files.catbox.moe/xj6uyb.mp3",
                    image: "https://files.catbox.moe/yfjane.jpg"
                }
            ];
            preloadAllTracks();
            initializePlayer();
        }

        function preloadAllTracks() {
            playlist.forEach((track) => {
                const audio = new Audio();
                audio.src = track.path;
                audio.preload = 'auto';
                audio.load();
                track.audioElement = audio; // simpan sebagai cache
            });
        }

        function initializePlayer() {
            loadTrack(currentTrackIndex);
        }

        function loadTrack(index) {
            const track = playlist[index];

            // Pakai audio preload jika sudah ready
            if (track.audioElement && track.audioElement.readyState >= 4) {
                audioPlayer.src = track.audioElement.src;
            } else {
                // Kalau belum preload, pakai langsung dari path
                audioPlayer.src = track.path;
            }

            currentTrack.textContent = track.name;
            currentArtist.textContent = track.artist;

            const trackArtwork = document.getElementById('trackArtwork');
            if (track.image) {
                trackArtwork.src = track.image;
                trackArtwork.style.display = 'block';
            } else {
                trackArtwork.style.display = 'none';
            }

            updateTrackList();

            // Update durasi saat metadata ready
            audioPlayer.addEventListener('loadedmetadata', () => {
                duration.textContent = formatTime(audioPlayer.duration);
            }, { once: true });
        }

        function updateTrackList() {
            trackList.innerHTML = '';
            playlist.forEach((track, index) => {
                const trackItem = document.createElement('div');
                trackItem.className = `track-item ${index === currentTrackIndex ? 'active' : ''}`;
                trackItem.innerHTML = `
                    <div class="track-item-number">${index + 1}</div>
                    ${track.image ? `<img src="${track.image}" alt="${track.name}" class="track-artwork">` : '<div class="track-artwork placeholder"></div>'}
                    <div class="track-item-info">
                        <div class="track-item-name">${track.name}</div>
                        <div class="track-item-artist">${track.artist}</div>
                    </div>
                    <div class="track-item-duration" id="duration-${index}">--:--</div>
                `;
                trackItem.addEventListener('click', () => {
                    currentTrackIndex = index;
                    loadTrack(currentTrackIndex);
                    playTrack();
                });
                trackList.appendChild(trackItem);
                loadTrackDuration(track.path, index);
            });
            playlistCount.textContent = `${playlist.length} tracks`;
        }

        function loadTrackDuration(path, index) {
            const audio = new Audio();
            audio.src = path;
            audio.addEventListener('loadedmetadata', () => {
                const durationElement = document.getElementById(`duration-${index}`);
                if (durationElement) {
                    durationElement.textContent = formatTime(audio.duration);
                }
            });
        }

        function playTrack() {
            if (!audioUnlocked) {
                console.log("🔒 Audio not unlocked yet, attempting to unlock...");
                initAudioUnlock();
                setTimeout(() => {
                    playTrack();
                }, 100);
                return;
            }
            // Jika preload sudah siap
            if (playlist[currentTrackIndex].audioElement && playlist[currentTrackIndex].audioElement.readyState >= 4) {
                audioPlayer.src = playlist[currentTrackIndex].audioElement.src;
            } else {
                audioPlayer.src = playlist[currentTrackIndex].path;
            }

            audioPlayer.play().then(() => {
                isPlaying = true;
                playIcon.className = 'fas fa-pause';
                console.log("🎵 Now playing:", playlist[currentTrackIndex].name);
            }).catch(error => {
                console.log("❌ Play failed:", error);
                // Coba unlock lagi jika gagal
                audioUnlocked = false;
                initAudioUnlock();
                setTimeout(() => {
                    audioPlayer.play().then(() => {
                        isPlaying = true;
                        playIcon.className = 'fas fa-pause';
                    });
                }, 500);
            });
        }

        function pauseTrack() {
            audioPlayer.pause();
            isPlaying = false;
            playIcon.className = 'fas fa-play';
        }

        function nextTrack() {
            currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
            loadTrack(currentTrackIndex);
            if (isPlaying) {
                setTimeout(() => {
                    playTrack();
                }, 100);
            }
        }

        function prevTrack() {
            currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
            loadTrack(currentTrackIndex);
            if (isPlaying) {
                setTimeout(() => {
                    playTrack();
                }, 100);
            }
        }

        function formatTime(seconds) {
            if (isNaN(seconds)) return "0:00";
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }

        function updateProgress() {
            if (audioPlayer.duration) {
                const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progress.style.width = `${percent}%`;
                currentTime.textContent = formatTime(audioPlayer.currentTime);
            }
        }

        function setProgress(e) {
            if (audioPlayer.duration) {
                const width = this.clientWidth;
                const clickX = e.offsetX;
                audioPlayer.currentTime = (clickX / width) * audioPlayer.duration;
            }
        }

        // Event listener tombol
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            if (isPlaying) {
                pauseTrack();
            } else {
                playTrack();
            }
        });
        document.getElementById('prevBtn').addEventListener('click', prevTrack);
        document.getElementById('nextBtn').addEventListener('click', nextTrack);
        document.getElementById('progressBar').addEventListener('click', setProgress);
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('ended', nextTrack);

        // Load playlist dan preload
        loadSpotifyPlaylist();
    });
