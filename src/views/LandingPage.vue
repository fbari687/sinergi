<script setup></script>

<template>
  <section class="min-h-screen gradient-bg relative overflow-hidden">
    <div class="particles">
      <div class="particle particle-sm particle-1" style="left: 3%; animation-delay: 0s"></div>
      <div class="particle particle-md particle-2" style="left: 8%; animation-delay: 1s"></div>
      <div class="particle particle-lg particle-3" style="left: 13%; animation-delay: 2s"></div>
      <div class="particle particle-xl particle-4" style="left: 18%; animation-delay: 3s"></div>
      <div class="particle particle-sm particle-5" style="left: 23%; animation-delay: 4s"></div>
      <div class="particle particle-md particle-1" style="left: 28%; animation-delay: 5s"></div>
      <div class="particle particle-lg particle-2" style="left: 33%; animation-delay: 6s"></div>
      <div class="particle particle-xl particle-3" style="left: 38%; animation-delay: 7s"></div>
      <div class="particle particle-sm particle-4" style="left: 43%; animation-delay: 8s"></div>
      <div class="particle particle-md particle-5" style="left: 48%; animation-delay: 9s"></div>
      <div class="particle particle-lg particle-1" style="left: 53%; animation-delay: 10s"></div>
      <div class="particle particle-xl particle-2" style="left: 58%; animation-delay: 11s"></div>
      <div class="particle particle-sm particle-3" style="left: 63%; animation-delay: 12s"></div>
      <div class="particle particle-md particle-4" style="left: 68%; animation-delay: 13s"></div>
      <div class="particle particle-lg particle-5" style="left: 73%; animation-delay: 14s"></div>
      <div class="particle particle-xl particle-1" style="left: 78%; animation-delay: 15s"></div>
      <div class="particle particle-sm particle-2" style="left: 83%; animation-delay: 16s"></div>
      <div class="particle particle-md particle-3" style="left: 88%; animation-delay: 17s"></div>
      <div class="particle particle-lg particle-4" style="left: 93%; animation-delay: 18s"></div>
    </div>

    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
      <nav class="flex justify-between items-center mb-6 sm:mb-8 lg:mb-10 animate-fade-in-up">
        <div class="text-white text-base sm:text-lg lg:text-xl font-bold"><img src="/logo_sinergi_white.png" class="h-12" alt="logo" /></div>
        <RouterLink to="/login" class="text-white hover:text-gray-200 transition-colors backdrop-blur-md bg-white/10 border border-white/20 px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm">
          <i class="fas fa-sign-in-alt mr-1"></i>Masuk
        </RouterLink>
      </nav>

      <div class="flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-10 min-h-[calc(100vh-180px)]">
        <div class="text-white space-y-3 sm:space-y-4 lg:w-1/2 order-2 lg:order-1">
          <div class="animate-fade-in-up delay-100">
            <h1 class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-2.5 lg:mb-3 leading-tight">SINERGI</h1>
            <div class="h-0.5 w-16 sm:w-20 lg:w-24 bg-white rounded-full mb-2 sm:mb-3 lg:mb-4"></div>
          </div>

          <p class="text-xs sm:text-sm lg:text-base opacity-90 leading-relaxed animate-fade-in-up delay-200">Platform kolaborasi akademik yang menyatukan mahasiswa, dosen, alumni, dan pakar dalam satu ekosistem inovatif.</p>

          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3 lg:pt-4 animate-fade-in-up delay-300">
            <RouterLink to="/login" class="btn-hover bg-white text-purple-600 px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm lg:text-base hover:shadow-2xl transition-all relative z-10 text-center">
              <i class="fas fa-rocket mr-1 sm:mr-2"></i>Mulai Sekarang
            </RouterLink>
            <a
              href="#features"
              class="btn-hover backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm lg:text-base hover:bg-white hover:text-purple-600 transition-all relative z-10 text-center"
            >
              <i class="fas fa-info-circle mr-1 sm:mr-2"></i>Pelajari Lebih Lanjut
            </a>
          </div>

          <div class="grid grid-cols-3 pb-4 gap-2 sm:gap-3 lg:gap-4 pt-4 sm:pt-6 md:pb-0 lg:pt-8 animate-fade-in-up delay-400">
            <div class="text-center">
              <div class="text-lg sm:text-xl lg:text-2xl font-bold mb-1">10K+</div>
              <div class="text-xs opacity-80">Pengguna Aktif</div>
            </div>
            <div class="text-center">
              <div class="text-lg sm:text-xl lg:text-2xl font-bold mb-1">500+</div>
              <div class="text-xs opacity-80">Komunitas</div>
            </div>
            <div class="text-center">
              <div class="text-lg sm:text-xl lg:text-2xl font-bold mb-1">50+</div>
              <div class="text-xs opacity-80">Mitra</div>
            </div>
          </div>
        </div>

        <div class="relative lg:w-1/2 animate-fade-in-right delay-300 order-1 lg:order-2 max-w-calc[80%] md:max-w-2xl">
          <div class="animate-float">
            <img src="/landingpage.png" alt="Sinergi Platform Mockup" class="w-full h-auto drop-shadow-2xl rounded-2xl" onerror="this.src='https://placehold.co/800x600/667eea/ffffff?text=Sinergi+Platform'" />
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-0 left-0 w-full" style="margin-bottom: -1px">
      <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full block">
        <path
          d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          fill="white"
        />
      </svg>
    </div>
  </section>

  <section id="features" class="py-8 sm:py-10 lg:py-12 bg-white">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-6 sm:mb-8 lg:mb-10">
        <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 lg:mb-3">Fitur <span class="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Unggulan</span></h2>
        <p class="text-xs sm:text-sm lg:text-base text-gray-600 max-w-2xl mx-auto px-4">Alat dan layanan lengkap untuk mendukung kolaborasi dan pengembangan karir Anda</p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        <div class="feature-card bg-white rounded-xl p-4 sm:p-5 lg:p-6 shadow-lg border border-gray-100">
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <i class="fas fa-users text-white text-base sm:text-lg"></i>
          </div>
          <h3 class="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-2">Komunitas Dinamis</h3>
          <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Bergabung dengan komunitas berbasis minat dan bangun jaringan profesional yang kuat dengan mahasiswa dan profesional lainnya.</p>
        </div>

        <div class="feature-card bg-white rounded-xl p-4 sm:p-5 lg:p-6 shadow-lg border border-gray-100">
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <i class="fas fa-comments text-white text-base sm:text-lg"></i>
          </div>
          <h3 class="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-2">Forum Interaktif</h3>
          <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Diskusi, tanya jawab, dan berbagi pengetahuan dalam platform forum yang terstruktur dan mudah diakses.</p>
        </div>

        <div class="feature-card bg-white rounded-xl p-4 sm:p-5 lg:p-6 shadow-lg border border-gray-100">
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <i class="fas fa-edit text-white text-base sm:text-lg"></i>
          </div>
          <h3 class="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-2">Postingan & Konten</h3>
          <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Bagikan artikel, tutorial, dan pengalaman Anda kepada ribuan pengguna aktif di platform.</p>
        </div>

        <div class="feature-card bg-white rounded-xl p-4 sm:p-5 lg:p-6 shadow-lg border border-gray-100">
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <i class="fas fa-briefcase text-white text-base sm:text-lg"></i>
          </div>
          <h3 class="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-2">Pengembangan Karir</h3>
          <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Akses lowongan kerja, mentoring, dan peluang kolaborasi dengan mitra industri terkemuka.</p>
        </div>

        <div class="feature-card bg-white rounded-xl p-4 sm:p-5 lg:p-6 shadow-lg border border-gray-100">
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <i class="fas fa-graduation-cap text-white text-base sm:text-lg"></i>
          </div>
          <h3 class="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-2">Koneksi Akademik</h3>
          <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Terhubung langsung dengan dosen, alumni, dan pakar dari berbagai bidang ilmu.</p>
        </div>

        <div class="feature-card bg-white rounded-xl p-4 sm:p-5 lg:p-6 shadow-lg border border-gray-100">
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <i class="fas fa-shield-alt text-white text-base sm:text-lg"></i>
          </div>
          <h3 class="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-2">Keamanan Terjamin</h3>
          <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Platform yang aman dengan sistem verifikasi dan moderasi konten yang ketat.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="py-8 sm:py-10 lg:py-12 bg-linear-to-r from-purple-800 to-sky-600 relative overflow-hidden">
    <div class="absolute inset-0 opacity-10">
      <div class="absolute top-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div class="absolute bottom-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
    </div>

    <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">Siap Memulai Perjalanan Anda?</h2>
      <p class="text-xs sm:text-sm lg:text-base text-white opacity-90 mb-4 sm:mb-5 lg:mb-6 max-w-2xl mx-auto">Bergabunglah dengan ribuan mahasiswa, dosen, dan profesional lainnya dalam platform kolaborasi terdepan.</p>
      <RouterLink to="/register" class="inline-block btn-hover bg-white text-purple-600 px-5 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm lg:text-base hover:shadow-2xl transition-all relative z-10">
        <i class="fas fa-user-plus mr-1 sm:mr-2"></i>Daftar Gratis Sekarang
      </RouterLink>
    </div>
  </section>

  <footer class="bg-gray-900 text-white py-6 sm:py-8 lg:py-10">
    <!-- <div class="container mx-auto px-4 sm:px-6 lg:px-8"> -->
    <!-- <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div>
                    <h3 class="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3">
                        <i class="fas fa-network-wired mr-1 sm:mr-2"></i>SINERGI
                    </h3>
                    <p class="text-xs sm:text-sm text-gray-400">
                        Platform kolaborasi akademik untuk masa depan yang lebih cerah.
                    </p>
                </div>
                <div>
                    <h4 class="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Produk</h4>
                    <ul class="space-y-1.5 text-xs sm:text-sm text-gray-400">
                        <li><a href="#" class="hover:text-white transition-colors">Komunitas</a></li>
                        <li><a href="#" class="hover:text-white transition-colors">Forum</a></li>
                        <li><a href="#" class="hover:text-white transition-colors">Postingan</a></li>
                        <li><a href="#" class="hover:text-white transition-colors">Karir</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Perusahaan</h4>
                    <ul class="space-y-1.5 text-xs sm:text-sm text-gray-400">
                        <li><a href="#" class="hover:text-white transition-colors">Tentang Kami</a></li>
                        <li><a href="#" class="hover:text-white transition-colors">Blog</a></li>
                        <li><a href="#" class="hover:text-white transition-colors">Kontak</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Ikuti Kami</h4>
                    <div class="flex gap-2 sm:gap-3">
                        <a href="#" class="w-8 h-8 sm:w-9 sm:h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors">
                            <i class="fab fa-facebook-f text-xs"></i>
                        </a>
                        <a href="#" class="w-8 h-8 sm:w-9 sm:h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors">
                            <i class="fab fa-twitter text-xs"></i>
                        </a>
                        <a href="#" class="w-8 h-8 sm:w-9 sm:h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors">
                            <i class="fab fa-instagram text-xs"></i>
                        </a>
                        <a href="#" class="w-8 h-8 sm:w-9 sm:h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors">
                            <i class="fab fa-linkedin-in text-xs"></i>
                        </a>
                    </div>
                </div>
            </div> -->
    <div class="border-t border-gray-800 pt-4 sm:pt-6 text-center text-xs sm:text-sm text-gray-400">
      <p>&copy; 2025 Sinergi. All rights reserved.</p>
    </div>
    <!-- </div> -->
  </footer>
</template>

<style scoped>
img {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

.animate-fade-in-right {
  animation: fadeInRight 0.8s ease-out forwards;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.gradient-bg {
  background: linear-gradient(-45deg, #667eea, #764ba2, #155378, #4facfe);
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
}

.delay-100 {
  animation-delay: 0.1s;
}
.delay-200 {
  animation-delay: 0.2s;
}
.delay-300 {
  animation-delay: 0.3s;
}
.delay-400 {
  animation-delay: 0.4s;
}
.delay-500 {
  animation-delay: 0.5s;
}

.btn-hover {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn-hover::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn-hover:hover::before {
  width: 300px;
  height: 300px;
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.particle {
  position: absolute;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
}

.particle-sm {
  width: 4px;
  height: 4px;
}
.particle-md {
  width: 8px;
  height: 8px;
}
.particle-lg {
  width: 12px;
  height: 12px;
}
.particle-xl {
  width: 16px;
  height: 16px;
}

@keyframes particle-float {
  0% {
    transform: translateY(100vh) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) translateX(100px) rotate(360deg);
    opacity: 0;
  }
}

.particle-1 {
  animation: particle-float 15s infinite;
}
.particle-2 {
  animation: particle-float 18s infinite;
}
.particle-3 {
  animation: particle-float 20s infinite;
}
.particle-4 {
  animation: particle-float 22s infinite;
}
.particle-5 {
  animation: particle-float 25s infinite;
}

.feature-card {
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-10px);
}

@media (min-width: 1024px) {
  body {
    zoom: 0.9;
    -moz-transform: scale(0.9);
    transform: scale(0.9);
    -moz-transform-origin: 0 0;
    transform-origin: 0 0;
  }
}
</style>
