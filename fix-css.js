const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki Tailwind CSS...');

// 1. Perbaiki globals.css dengan Tailwind yang benar
const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom Styles */
.gradient-navy {
  background: linear-gradient(135deg, #0a2540 0%, #1e3a5f 100%);
}

.gradient-gold {
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
}

.text-gold {
  color: #d4af37;
}

.bg-navy {
  background-color: #0a2540;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-pulse-soft {
  animation: pulseSoft 2s ease-in-out infinite;
}

@keyframes pulseSoft {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media print {
  .no-print {
    display: none !important;
  }
  body {
    background: white !important;
  }
}

/* Scrollbar */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

/* Card Styles */
.card {
  @apply bg-white rounded-xl shadow p-5;
}

.card-hover {
  @apply hover:shadow-xl transition-shadow;
}
`;

fs.writeFileSync(path.join(__dirname, 'app', 'globals.css'), globalsCss, 'utf8');
console.log('✅ globals.css diperbaiki');

// 2. Pastikan tailwind.config.js benar
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0a2540',
          light: '#1e3a5f',
          dark: '#061a30',
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#f4d03f',
          dark: '#b8941f',
        },
      },
    },
  },
  plugins: [],
};
`;

fs.writeFileSync(path.join(__dirname, 'tailwind.config.js'), tailwindConfig, 'utf8');
console.log('✅ tailwind.config.js diperbaiki');

// 3. Update postcss.config.js jika ada
const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

fs.writeFileSync(path.join(__dirname, 'postcss.config.js'), postcssConfig, 'utf8');
console.log('✅ postcss.config.js diperbaiki');

console.log('\n🎉 CSS berhasil diperbaiki!');
console.log('👉 Tekan Ctrl+C, lalu jalankan: npm run dev');