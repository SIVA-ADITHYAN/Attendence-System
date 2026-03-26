import React from 'react';

const Footer = () => {
    return (
        <footer className="py-6 px-8 text-center text-xs text-slate-400 bg-background-light">
            <p>&copy; {new Date().getFullYear()} AttendX App. All rights reserved.</p>
        </footer>
    );
};

export default Footer;
