import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
      <span>
        © {new Date().getFullYear()} <span>سند</span> – سندك في حياتك الجامعية 🎓
      </span>
      <span style={{ opacity: 0.5 }}>|</span>
      <Link to="/payment/preview" style={{ fontSize: '0.9rem' }}>
        معاينة صفحة الدفع
      </Link>
    </footer>
  );
};

export default Footer;