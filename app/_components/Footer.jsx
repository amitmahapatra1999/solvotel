import React from 'react';

export const Footer = () => {
    return (
        <div>
            <footer className="bg-blue-900 text-white p-4">
                <div className="container mx-auto text-center">
                    © {new Date().getFullYear()}, Solvotel . All Rights Reserved.
                </div>
            </footer>
        </div>
    );
};

