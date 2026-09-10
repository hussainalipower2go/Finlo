"use client";

const WhatsAppIcon = () => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="#ffffff" aria-hidden="true">
    <path d="M16.004 3C8.826 3 3 8.826 3 16.004c0 2.293.6 4.535 1.742 6.508L3 29l6.681-1.727a12.96 12.96 0 0 0 6.323 1.61h.005C23.182 28.883 29 23.059 29 15.881 29 12.195 27.605 8.79 25.091 6.28A12.88 12.88 0 0 0 16.004 3zm0 23.733h-.004c-2.112 0-4.185-.567-5.974-1.637l-.428-.254-3.966 1.025 1.058-3.866-.279-.445a10.74 10.74 0 0 1-1.645-5.72c0-5.913 4.811-10.723 10.727-10.723 2.865 0 5.558 1.116 7.583 3.143a10.65 10.65 0 0 1 3.14 7.584c0 5.912-4.81 10.72-10.721 10.72zm5.888-8.03c-.323-.161-1.91-.943-2.206-1.05-.295-.108-.511-.161-.726.161-.215.322-.833 1.05-1.021 1.266-.188.215-.376.242-.699.08-.323-.161-1.362-.502-2.594-1.6-.959-.856-1.607-1.913-1.795-2.236-.188-.323-.02-.498.141-.658.145-.145.322-.376.484-.564.161-.188.215-.322.322-.537.108-.215.054-.403-.027-.564-.08-.161-.726-1.75-.995-2.396-.262-.63-.527-.544-.726-.554l-.618-.011a1.188 1.188 0 0 0-.862.403c-.296.323-1.129 1.103-1.129 2.69 0 1.586 1.156 3.119 1.318 3.334.161.215 2.275 3.475 5.513 4.872.77.332 1.371.531 1.84.68.773.245 1.477.211 2.033.128.62-.093 1.91-.781 2.179-1.535.269-.754.269-1.4.188-1.535-.08-.134-.295-.215-.618-.377z" />
  </svg>
);

export default function FloatingWhatsApp() {
  const href = "https://wa.me/923422866127?text=" + encodeURIComponent("Assalam o Alaikum! Finlo app ke baare mein baat karni hai.");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      style={{
        position: "fixed",
        right: 22,
        bottom: 22,
        width: 56,
        height: 56,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,#25D366,#128C7E)",
        boxShadow: "0 12px 28px rgba(18,140,126,0.4), inset 0 1px 0 rgba(255,255,255,0.35)",
        zIndex: 1000,
        transition: "transform 0.15s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      <WhatsAppIcon />
    </a>
  );
}