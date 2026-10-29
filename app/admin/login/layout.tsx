// Layout kosong untuk halaman login admin
// Ini membatalkan layout admin utama sehingga sidebar tidak muncul
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}