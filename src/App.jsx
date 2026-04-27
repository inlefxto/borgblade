import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import BookingModal from './components/BookingModal';
import AdminDashboard from './components/AdminDashboard';

// ============================================================
// DATA
// ============================================================
const BARBERS = [
  {
    id: "marco",
    name: "Marco Borg",
    role: "Owner & Master Barber",
    specialty: "Skin Fades & Classic Cuts",
    avatar: "/Marco.png",
  },
  {
    id: "luca",
    name: "Luca Farrugia",
    role: "Senior Barber",
    specialty: "Scissor Cuts & Beard Sculpting",
    avatar: "/Luca.png",
  },
  {
    id: "dylan",
    name: "Dylan Camilleri",
    role: "Barber",
    specialty: "Hair Design & Fades",
    avatar: "/Dylan.png",
  },
];

const SERVICES = {
  Haircuts: [
    { name: "Haircut (Clipper)", price: 8, duration: "30 min" },
    { name: "Skinfade Haircut", price: 14, duration: "30 min" },
    { name: "Scissors Classic Haircut", price: 16, duration: "45 min" },
    { name: "Long Scissors Haircut", price: 18, duration: "45 min" },
    { name: "Haircut + Wash & Style", price: 20, duration: "40 min" },
    { name: "Boy's Haircut (0-5 yrs)", price: 11, duration: "20 min" },
    { name: "+65 Haircut", price: 12, duration: "30 min" },
    { name: "Head Shave (Clipper)", price: 10, duration: "30 min" },
    { name: "Clean Head Shave", price: 13, duration: "30 min" },
    { name: "Hairstyling", price: 6, duration: "15 min" },
  ],
  "Beard Grooming": [
    { name: "Beard Grooming", price: 8, duration: "15 min" },
    { name: "Beard Clean Shave", price: 8, duration: "15 min" },
    { name: "Hot Towel Beard Grooming", price: 10, duration: "20 min" },
    { name: "Premium Beard Clean Shave", price: 10, duration: "20 min" },
  ],
  Combos: [
    { name: "Haircut & Skinfade", price: 14, duration: "30 min" },
    { name: "Haircut & Beard Trim", price: 20, duration: "45 min" },
    { name: "Skinfade & Beard Grooming", price: 18, duration: "45 min" },
    { name: "Skin Fade & Design", price: 16, duration: "30 min" },
    { name: "Haircut, Eyebrows & Beard", price: 20, duration: "1 hr" },
    { name: "Full Service (Haircut + Facial + Eyebrows)", price: 50, duration: "1 hr 15 min" },
  ],
  Extras: [
    { name: "Eyebrows", price: 5, duration: "15 min" },
    { name: "Eyebrows, Ears & Nose Waxing", price: 10, duration: "15 min" },
    { name: "Ears & Nose Waxing", price: 5, duration: "15 min" },
  ],
};

const TIMES = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","14:00","14:30","15:00",
  "15:30","16:00","16:30","17:00","17:30","18:00","18:30",
];



const HOURS = { open: 9, close: 19, days: [2, 3, 4, 5, 6] };

function isOpenNow() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  return HOURS.days.includes(day) && hour >= HOURS.open && hour < HOURS.close;
}

function genRef() {
  return "BB-" + Math.floor(10000 + Math.random() * 90000);
}

// ============================================================
// SERVICE CARD
// ============================================================
function ServiceCard({ name, price, duration, openBookingModal }) {
  return (
    <div className="service-card">
      <div className="sc-top">
        <span className="sc-name">{name}</span>
        <span className="sc-dur">{duration}</span>
      </div>
      <div className="sc-right">
        <span className="sc-price">€{price}</span>
        <button className="sc-book-btn" onClick={() => openBookingModal()}>Book</button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
function MainSite() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("Haircuts");
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [open] = useState(isOpenNow());
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const openBookingModal = () => setBookingModalOpen(true);

  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const servicesRef = useRef(null);
  const galleryRef = useRef(null);
  const findusRef = useRef(null);

  const sectionRefs = { home: homeRef, about: aboutRef, services: servicesRef, gallery: galleryRef, findus: findusRef };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      const scrollY = window.scrollY + 100;
      let current = "home";
      Object.entries(sectionRefs).forEach(([id, ref]) => {
        if (ref.current && ref.current.offsetTop <= scrollY) current = id;
      });
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const navLinks = [
    { id: "about", label: "About" },
    { id: "services", label: "Services" },
    { id: "gallery", label: "Gallery" },
    { id: "findus", label: "Find Us" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        :root {
          --gold: #C9A84C; --gold-light: #E2C170;
          --black: #0A0A0A; --surface: #111111; --surface2: #181818;
          --border: #222222; --white: #F2F2F2; --muted: #888888;
          --font-display: 'Bebas Neue', sans-serif; --font-body: 'DM Sans', sans-serif;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--black); color: var(--white); font-family: var(--font-body); overflow-x: hidden; }

        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 72px;
          transition: background 0.3s, height 0.3s, border-bottom 0.3s;
          border-bottom: 1px solid transparent;
        }
        nav.scrolled { background: rgba(10,10,10,0.97); height: 60px; border-bottom: 1px solid var(--border); backdrop-filter: blur(10px); }
        .nav-left { display: flex; align-items: center; gap: 24px; }
        .nav-logo { font-family: var(--font-display); font-size: 1.6rem; letter-spacing: 0.08em; color: var(--white); text-decoration: none; }
        .nav-logo span { color: var(--gold); }
        .open-badge { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
        .open-dot { width: 7px; height: 7px; border-radius: 50%; }
        .open-dot.open { background: #4ade80; animation: pulse-green 2s infinite; }
        .open-dot.closed { background: #f87171; }
        .open-text.open { color: #4ade80; }
        .open-text.closed { color: #f87171; }
        @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); } 70% { box-shadow: 0 0 0 6px rgba(74,222,128,0); } 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); } }
        .nav-links { display: flex; gap: 32px; list-style: none; }
        .nav-links button { color: var(--muted); text-decoration: none; font-size: 0.82rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; transition: color 0.2s; cursor: pointer; background: none; border: none; padding: 0; font-family: var(--font-body); }
        .nav-links button:hover { color: var(--white); }
        .nav-links button.active { color: var(--gold); }
        .nav-right { display: flex; align-items: center; gap: 16px; }
        .hamburger { display: none; flex-direction: column; justify-content: center; gap: 5px; width: 36px; height: 36px; background: none; border: none; cursor: pointer; padding: 4px; }
        .hamburger span { display: block; height: 1.5px; background: var(--white); border-radius: 1px; transition: transform 0.3s, opacity 0.3s; }
        .hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity: 0; }
        .hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }
        .mobile-menu { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10,10,10,0.98); z-index: 90; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
        .mobile-menu.open { display: flex; animation: fadeIn 0.2s ease; }
        .mobile-menu button { font-family: var(--font-display); font-size: 2.8rem; letter-spacing: 0.08em; color: var(--muted); cursor: pointer; transition: color 0.2s; background: none; border: none; padding: 4px 0; }
        .mobile-menu button:hover { color: var(--white); }
        .mobile-cta-wrap { margin-top: 24px; }

        .btn-nav { background: var(--gold); color: var(--black); border: none; padding: 10px 22px; font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.08em; cursor: pointer; transition: background 0.2s, transform 0.15s; }
        .btn-nav:hover { background: var(--gold-light); transform: translateY(-1px); }
        .btn-gold { background: var(--gold); color: var(--black); border: none; padding: 14px 36px; font-family: var(--font-display); font-size: 1.1rem; letter-spacing: 0.1em; cursor: pointer; transition: background 0.2s, transform 0.15s, box-shadow 0.2s; position: relative; overflow: hidden; }
        .btn-gold::after { content: ''; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%); transform: translateX(-100%); transition: transform 0.4s; }
        .btn-gold:hover { background: var(--gold-light); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.3); }
        .btn-gold:hover::after { transform: translateX(100%); }
        .btn-gold:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); padding: 14px 24px; font-family: var(--font-body); font-size: 0.9rem; cursor: pointer; transition: color 0.2s, border-color 0.2s; }
        .btn-ghost:hover { color: var(--white); border-color: var(--white); }

        .hero { position: relative; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.7) 60%, rgba(10,10,10,1) 100%), url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1800&q=80') center/cover no-repeat; }
        .hero-stripe { position: absolute; inset: 0; opacity: 0.03; background: repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(201,168,76,1) 4px, rgba(201,168,76,1) 5px); }
        .hero-content { position: relative; z-index: 2; animation: fadeUp 1s ease both; }
        .hero-eyebrow { font-size: 0.75rem; font-weight: 500; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 16px; }
        .hero-title { font-family: var(--font-display); font-size: clamp(4rem, 12vw, 9rem); line-height: 0.9; letter-spacing: 0.03em; color: var(--white); margin-bottom: 8px; }
        .hero-title span { color: var(--gold); }
        .hero-sub { font-size: 1rem; font-weight: 300; color: var(--muted); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 48px; }
        .hero-cta { display: flex; align-items: center; gap: 24px; justify-content: center; }
        .hero-location { font-size: 0.78rem; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 24px; }
        .hero-scroll { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--muted); font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; animation: bounce 2s infinite; }
        .scroll-line { width: 1px; height: 40px; background: linear-gradient(to bottom, var(--gold), transparent); }

        section { padding: 100px 40px; max-width: 1200px; margin: 0 auto; }
        .section-label { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }
        .section-title { font-family: var(--font-display); font-size: clamp(2.5rem, 6vw, 4.5rem); line-height: 1; letter-spacing: 0.03em; margin-bottom: 48px; }
        .gold-line { width: 60px; height: 2px; background: var(--gold); margin-bottom: 48px; }

        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .about-img-wrap { position: relative; }
        .about-img-wrap > div:first-child { overflow: hidden; position: relative; aspect-ratio: 4/5; width: 100%; }
        .about-img-wrap img { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }
        .about-img-accent { position: absolute; top: -16px; left: -16px; right: 16px; bottom: 16px; border: 1px solid var(--gold); z-index: -1; }
        .about-badge { position: absolute; bottom: -20px; right: -20px; background: var(--gold); color: var(--black); width: 100px; height: 100px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 2rem; line-height: 1; }
        .about-badge small { font-family: var(--font-body); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
        .about-text p { color: var(--muted); line-height: 1.8; font-size: 0.95rem; margin-bottom: 20px; }
        .about-stats { display: flex; gap: 40px; margin-top: 40px; padding-top: 40px; border-top: 1px solid var(--border); }
        .stat-num { font-family: var(--font-display); font-size: 2.5rem; color: var(--gold); line-height: 1; }
        .stat-label { font-size: 0.72rem; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }

        .team-section { background: var(--surface2); max-width: 100%; padding: 72px 40px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .team-inner { max-width: 1200px; margin: 0 auto; }
        .team-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; }
        .team-card { background: var(--surface); border: 1px solid var(--border); padding: 28px; display: flex; align-items: center; gap: 20px; transition: border-color 0.2s; }
        .team-card:hover { border-color: var(--gold); }
        .team-avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); flex-shrink: 0; }
        .team-info { display: flex; flex-direction: column; gap: 3px; }
        .team-name { font-weight: 600; font-size: 0.95rem; }
        .team-role { font-size: 0.75rem; color: var(--gold); letter-spacing: 0.05em; }
        .team-spec { font-size: 0.75rem; color: var(--muted); }

        .services-section { background: var(--surface); max-width: 100%; padding: 100px 40px; }
        .services-inner { max-width: 1200px; margin: 0 auto; }
        .tabs-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; position: relative; }
        .tabs-wrap::-webkit-scrollbar { display: none; }
        .tabs-outer { position: relative; }
        .tabs-outer::after { content: ''; position: absolute; top: 0; right: 0; bottom: 0; width: 60px; background: linear-gradient(to right, transparent, var(--surface)); pointer-events: none; z-index: 1; }
        .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); min-width: max-content; }
        .tab { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.08em; color: var(--muted); background: none; border: none; padding: 12px 24px; cursor: pointer; position: relative; transition: color 0.2s; white-space: nowrap; }
        .tab::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--gold); transform: scaleX(0); transition: transform 0.2s; }
        .tab.active { color: var(--white); }
        .tab.active::after { transform: scaleX(1); }
        .tab:hover { color: var(--white); }
        .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1px; background: var(--border); }

        .service-card { background: var(--surface); padding: 24px 28px; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; gap: 16px; }
        .service-card:hover { background: var(--surface2); }
        .service-card:hover .sc-book-btn { opacity: 1; transform: translateX(0); }
        .sc-top { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .sc-name { font-size: 0.9rem; font-weight: 500; color: var(--white); }
        .sc-dur { font-size: 0.75rem; color: var(--muted); letter-spacing: 0.05em; }
        .sc-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .sc-price { font-family: var(--font-display); font-size: 1.6rem; color: var(--gold); line-height: 1; white-space: nowrap; }
        .sc-book-btn { background: none; border: 1px solid var(--gold); color: var(--gold); padding: 5px 12px; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; white-space: nowrap; opacity: 0; transform: translateX(6px); transition: opacity 0.2s, transform 0.2s, background 0.2s, color 0.2s; }
        .sc-book-btn:hover { background: var(--gold); color: var(--black); }
        .services-cta { text-align: center; margin-top: 56px; }
        .services-cta p { color: var(--muted); font-size: 0.9rem; margin-bottom: 20px; }

        .gallery-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 300px 300px; gap: 8px; overflow: hidden; }
        .gallery-grid img { width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(30%); transition: filter 0.3s, transform 0.3s; }
        .gallery-grid img:hover { filter: grayscale(0%); transform: scale(1.02); }
        .gallery-grid .g-main { grid-row: 1 / 3; }

        .findus-section { background: var(--black); max-width: 100%; padding: 120px 40px; border-top: 1px solid var(--border); }
        .findus-inner { max-width: 1200px; margin: 0 auto; }
        .findus-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 48px; align-items: stretch; }
        .findus-details { display: flex; flex-direction: column; gap: 32px; }
        .findus-item { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
        .findus-item-label { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); }
        .findus-item-value { font-size: 0.95rem; color: var(--white); line-height: 1.6; }
        .findus-map-wrap { border: 1px solid var(--border); overflow: hidden; height: 100%; }
        .findus-map-wrap iframe { display: block; height: 100%; }

        footer { background: var(--surface); border-top: 1px solid var(--border); padding: 72px 40px 32px; }
        .footer-inner { max-width: 1200px; margin: 0 auto; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; padding-bottom: 48px; margin-bottom: 32px; border-bottom: 1px solid var(--border); }
        .footer-logo { font-family: var(--font-display); font-size: 2rem; letter-spacing: 0.08em; color: var(--white); margin-bottom: 12px; }
        .footer-logo span { color: var(--gold); }
        .footer-tagline { font-size: 0.82rem; color: var(--muted); font-style: italic; margin-bottom: 24px; }
        .footer-socials { display: flex; gap: 12px; }
        .social-link { width: 36px; height: 36px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--muted); text-decoration: none; font-size: 0.8rem; transition: border-color 0.2s, color 0.2s; }
        .social-link:hover { border-color: var(--gold); color: var(--gold); }
        .footer-col h4 { font-family: var(--font-display); font-size: 0.95rem; letter-spacing: 0.12em; color: var(--white); margin-bottom: 20px; }
        .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-col ul button { color: var(--muted); text-decoration: none; font-size: 0.85rem; transition: color 0.2s; cursor: pointer; background: none; border: none; font-family: var(--font-body); text-align: left; padding: 0; }
        .footer-col ul button:hover { color: var(--gold); }
        .footer-col p { color: var(--muted); font-size: 0.85rem; line-height: 1.8; }
        .footer-col p strong { color: var(--white); font-weight: 500; }
        .footer-bottom { display: flex; justify-content: space-between; align-items: center; }
        .footer-copy { font-size: 0.75rem; color: var(--muted); }
        .footer-made { font-size: 0.72rem; color: var(--border); }

        .mobile-sticky-cta { display: none; }

        .setmore-book-button { display: none !important; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }

        @media (max-width: 768px) {
          nav { padding: 0 20px; }
          .nav-links, .btn-nav { display: none; }
          .open-badge { display: none; }
          .hamburger { display: flex; }
          section { padding: 72px 20px; }
          .about-grid { grid-template-columns: 1fr; gap: 48px; }
          .team-grid { grid-template-columns: 1fr; gap: 16px; }
          .team-section { padding: 60px 20px; }
          .gallery-grid { grid-template-columns: 1fr 1fr; grid-template-rows: 200px 200px 200px; }
          .gallery-grid .g-main { grid-row: auto; }
          .findus-section { padding: 72px 20px; }
          .findus-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
          footer { padding: 48px 20px 24px; }
          .services-section { padding: 72px 20px; }
          .mobile-sticky-cta { display: block; position: fixed; bottom: 0; left: 0; right: 0; z-index: 99; padding: 12px 20px; background: var(--black); border-top: 1px solid var(--border); }
          .mobile-sticky-cta button { width: 100%; padding: 16px; font-size: 1.1rem; }
        }
      `}</style>

      {/* NAV */}
      <nav className={scrolled ? "scrolled" : ""}>
        <div className="nav-left">
          <a href="#" className="nav-logo">BORG <span>&</span> BLADE</a>
          <div className="open-badge">
            <div className={"open-dot " + (open ? "open" : "closed")} />
            <span className={"open-text " + (open ? "open" : "closed")}>{open ? "Open Now" : "Closed"}</span>
          </div>
        </div>
        <ul className="nav-links">
          {navLinks.map(({ id, label }) => (
            <li key={id}>
              <button className={activeSection === id ? "active" : ""} onClick={() => scrollTo(id)}>{label}</button>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          <button className="btn-nav" onClick={() => openBookingModal()}>Book Now</button>
          <button className={"hamburger " + (menuOpen ? "open" : "")} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={"mobile-menu " + (menuOpen ? "open" : "")}>
        {navLinks.map(({ id, label }) => (
          <button key={id} onClick={() => scrollTo(id)}>{label}</button>
        ))}
        <div className="mobile-cta-wrap">
          <button className="btn-gold" onClick={() => openBookingModal()}>Book an Appointment</button>
        </div>
      </div>

      {/* HERO */}
      <div id="home" ref={homeRef}>
        <div className="hero">
          <div className="hero-bg" />
          <div className="hero-stripe" />
          <div className="hero-content">
            <p className="hero-eyebrow">St. Julian's, Malta</p>
            <h1 className="hero-title">BORG<br /><span>&</span><br />BLADE</h1>
            <p className="hero-sub">Sharp cuts. No compromises.</p>
            <div className="hero-cta">
              <button className="btn-gold" onClick={() => openBookingModal()}>Book an Appointment</button>
            </div>
            <p className="hero-location">Tue – Sat &nbsp;·&nbsp; 09:00 – 19:00</p>
          </div>
          <div className="hero-scroll"><div className="scroll-line" /><span>Scroll</span></div>
        </div>
      </div>

      {/* ABOUT */}
      <section id="about" ref={aboutRef}>
        <div className="about-grid">
          <div style={{ position: 'relative' }}>
            <img
              src="/Marco.png"
              alt="Marco Borg - Master Barber"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
            {/* 8 Years badge */}
            <div style={{
              position: 'absolute',
              bottom: '-24px',
              right: '-24px',
              zIndex: 2,
              background: '#C9A84C',
              color: '#0A0A0A',
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.8rem',
              lineHeight: 1
            }}>
              8
              <small style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Years</small>
            </div>
          </div>
          <div className="about-text">
            <p className="section-label">The Barber</p>
            <h2 className="section-title">Marco<br />Borg</h2>
            <div className="gold-line" />
            <p>Born and raised in Malta, Marco Borg has been shaping the island's grooming scene for over eight years. Trained locally and refined in Milan, he brings an international edge to every chair.</p>
            <p>His signature? Precision fades that hold their line, and classic cuts tailored to the man — not just the trend. At Borg & Blade, every appointment is a craft, not a service.</p>
            <div className="about-stats">
              <div><div className="stat-num">8+</div><div className="stat-label">Years Experience</div></div>
              <div><div className="stat-num">2k+</div><div className="stat-label">Happy Clients</div></div>
              <div><div className="stat-num">1</div><div className="stat-label">Location</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <div className="team-section">
        <div className="team-inner">
          <p className="section-label">The Team</p>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Meet the Barbers</h2>
          <div className="team-grid">
            {BARBERS.map((b) => (
              <div className="team-card" key={b.id}>
                <img src={b.avatar} alt={b.name} className="team-avatar" loading="lazy" />
                <div className="team-info">
                  <span className="team-name">{b.name}</span>
                  <span className="team-role">{b.role}</span>
                  <span className="team-spec">{b.specialty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div className="services-section" id="services" ref={servicesRef}>
        <div className="services-inner">
          <p className="section-label">What We Do</p>
          <h2 className="section-title" style={{ marginBottom: "32px" }}>Our Services</h2>
          <div className="tabs-outer">
          <div className="tabs-wrap">
            <div className="tabs">
              {Object.keys(SERVICES).map((cat) => (
                <button key={cat} className={"tab " + (activeTab === cat ? "active" : "")} onClick={() => setActiveTab(cat)}>{cat}</button>
              ))}
            </div>
          </div>
          </div>
          <div className="services-grid">
            {SERVICES[activeTab].map((s) => (
              <ServiceCard key={s.name} {...s} openBookingModal={openBookingModal} />
            ))}
          </div>
          <div className="services-cta">
            <p>Ready to book your next visit?</p>
            <button className="btn-gold" onClick={() => openBookingModal()}>Book an Appointment</button>
          </div>
        </div>
      </div>

      {/* GALLERY */}
      <section id="gallery" ref={galleryRef}>
        <p className="section-label">The Work</p>
        <h2 className="section-title">Gallery</h2>
        <div className="gold-line" />
        <div className="gallery-grid">
          <img className="g-main" src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80" alt="Barbershop work" loading="lazy" />
          <img src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80" alt="Haircut" loading="lazy" />
          <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80" alt="Fade" loading="lazy" />
          <img src="https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80" alt="Beard" loading="lazy" />
          <img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80" alt="Scissors cut" loading="lazy" />
        </div>
      </section>

      {/* FIND US */}
      <div className="findus-section" id="findus" ref={findusRef}>
        <div className="findus-inner">
          <p className="section-label">Visit Us</p>
          <h2 className="section-title">Find Us</h2>
          <div className="gold-line" />
          <div className="findus-grid">
            <div className="findus-details">
              <div className="findus-item">
                <span className="findus-item-label">Barbershop</span>
                <span className="findus-item-value">Borg & Blade Barbershop</span>
              </div>
              <div className="findus-item">
                <span className="findus-item-label">Address</span>
                <span className="findus-item-value">12, Triq San Ġorġ<br />St. Julian's, Malta</span>
              </div>
              <div className="findus-item">
                <span className="findus-item-label">Phone</span>
                <span className="findus-item-value">+356 2134 5678</span>
              </div>
              <div className="findus-item">
                <span className="findus-item-label">Email</span>
                <span className="findus-item-value">hello@borgblade.mt</span>
              </div>
              <div className="findus-item">
                <span className="findus-item-label">Opening Hours</span>
                <span className="findus-item-value">Tue – Sat<br />09:00 – 19:00</span>
              </div>
            </div>
            <div className="findus-map-wrap">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3231.0!2d14.4933!3d35.9175!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x130e45281dcfffff%3A0x1!2sSt.+Julian's%2C+Malta!5e0!3m2!1sen!2smt!4v1" width="100%" height="460" style={{ border: 0, filter: 'grayscale(100%) invert(92%) contrast(83%)' }} allowFullScreen="" loading="lazy"></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">BORG <span>&</span> BLADE</div>
              <p className="footer-tagline">Sharp cuts. No compromises.</p>
              <div className="footer-socials">
                <a href="#" className="social-link" aria-label="Instagram">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Facebook">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="TikTok">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="footer-col">
              <h4>Navigate</h4>
              <ul>
                <li><button onClick={() => scrollTo("home")}>Home</button></li>
                <li><button onClick={() => scrollTo("about")}>About Marco</button></li>
                <li><button onClick={() => scrollTo("services")}>Services</button></li>
                <li><button onClick={() => scrollTo("gallery")}>Gallery</button></li>
                <li><button onClick={() => scrollTo("findus")}>Find Us</button></li>
                <li><button onClick={() => openBookingModal()}>Book Now</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Find Us</h4>
              <p>
                <strong>Borg & Blade Barbershop</strong><br />
                12, Triq San Gorg<br />
                St. Julian's, Malta<br /><br />
                <strong>+356 2134 5678</strong><br />
                hello@borgblade.mt<br /><br />
                <strong>Tue - Sat</strong><br />
                09:00 - 19:00
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copy">© {new Date().getFullYear()} Borg & Blade Barbershop. All rights reserved.</p>
            <p className="footer-made">St. Julian's, Malta · Est. 2016</p>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className="mobile-sticky-cta">
        <button className="btn-gold" onClick={() => openBookingModal()}>Book an Appointment</button>
      </div>

      <BookingModal isOpen={bookingModalOpen} onClose={() => setBookingModalOpen(false)} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
