import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      © {new Date().getFullYear()} <span>سند</span> – سندك في حياتك الجامعية 🎓
    </footer>
  );
};

export default Footer;