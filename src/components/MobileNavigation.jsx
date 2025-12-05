import React, { useState } from 'react';
import { Home, ArrowLeftRight, Globe, Droplet, Clock, Moon, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MobileNavigation = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);

  const navItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'swap', label: t('swap'), icon: ArrowLeftRight },
    { id: 'bridge', label: t('bridge'), icon: Globe },
    { id: 'liquidity', label: t('liquidity'), icon: Droplet },
    { id: 'transactions', label: t('transactions'), icon: Clock },
  ];

  return (
    <>
      {/* Top Header (Floating) - Mobile only */}
      <div className="md:hidden fixed top-4 left-0 right-0 z-50 flex justify-center">
        <div className="flex items-center justify-between rounded-none bg-white shadow-lg px-4 py-3 w-[95%]">
         
          {/* Icons */}
          <div className="flex items-center space-x-3">
            {/* Theme Icon */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2"
            >
              <Moon size={20} />
            </button>
            
            {/* Flag Icon */}
            <div className="p-2">
              <span className="text-lg">🇺🇸</span>
            </div>
            
            {/* Connect Wallet Button */}
            <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation (Floating) - Mobile only */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center">
        <div className="bg-white rounded-none shadow-lg p-2 w-[95%]">
          <div className="flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-none transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-500'
                  }`}
                >
                  <div className={`p-2 rounded-none ${isActive ? 'bg-blue-600' : ''}`}>
                    <Icon size={20} />
                  </div>
                  {isActive && (
                    <span className="text-xs mt-1">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Header - Visible only on md screens and up */}
      <div className="hidden md:flex fixed top-4 left-0 right-0 z-50 justify-center">
        <div className="flex items-center justify-between rounded-none bg-white shadow-lg px-6 py-3 w-full max-w-4xl">
          {/* Logo */}
          <div className="text-xl font-bold">Stac</div>
          
          {/* Navigation Links */}
          <div className="flex space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Right Side Controls */}
          <div className="flex items-center space-x-3">
            {/* Theme Icon */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Moon size={20} />
            </button>
            
            {/* Flag Icon */}
            <div className="p-2 rounded-lg hover:bg-gray-100">
              <span className="text-lg">🇺🇸</span>
            </div>
            
            {/* Connect Wallet Button */}
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;