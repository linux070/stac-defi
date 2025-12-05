import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTranslation } from 'react-i18next';

const CustomConnectButton = () => {
  const { t } = useTranslation();
  
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="btn-primary px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap"
                  >
                    {/* Stacked text for mobile, horizontal for desktop */}
                    <span className="md:hidden flex flex-col leading-tight">
                      <span>{t('connect')}</span>
                      <span>{t('wallet')}</span>
                    </span>
                    <span className="hidden md:inline">{t('connectWallet')}</span>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm font-medium rounded-full transition-all duration-200"
                  >
                    {t('wrongNetwork')}
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="hidden md:flex items-center gap-2 bg-white/10 dark:bg-white/10 backdrop-blur-lg hover:bg-white/20 dark:hover:bg-white/20 px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 border border-white/20"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 24, height: 24 }}
                          />
                        )}
                      </div>
                    )}
                    <span className="hidden lg:inline">{chain.name}</span>
                  </button>

                  {/* Stacked design for mobile, horizontal for desktop */}
                  <div className="md:hidden flex flex-col items-center">
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="bg-white/10 dark:bg-white/10 backdrop-blur-lg hover:bg-white/20 dark:hover:bg-white/20 px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 border border-white/20 mb-1"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 20, height: 20 }}
                            />
                          )}
                        </div>
                      )}
                    </button>
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="bg-white/10 dark:bg-white/10 backdrop-blur-lg hover:bg-white/20 dark:hover:bg-white/20 px-2 py-1 text-sm font-medium rounded-full transition-all duration-200 border border-white/20 flex items-center"
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-1">
                        {account.displayName?.charAt(0) || 'W'}
                      </div>
                      <span className="leading-tight text-xs">
                        {account.displayName?.substring(0, 4) || t('wallet')}
                      </span>
                    </button>
                  </div>

                  {/* Horizontal design for desktop */}
                  <div className="hidden md:flex items-center gap-2">
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="flex items-center gap-2 bg-white/10 dark:bg-white/10 backdrop-blur-lg hover:bg-white/20 dark:hover:bg-white/20 px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 border border-white/20"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 24, height: 24 }}
                            />
                          )}
                        </div>
                      )}
                      <span className="hidden lg:inline">{chain.name}</span>
                    </button>
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="bg-white/10 dark:bg-white/10 backdrop-blur-lg hover:bg-white/20 dark:hover:bg-white/20 px-2 py-1.5 text-sm font-medium rounded-full transition-all duration-200 border border-white/20 flex items-center gap-1"
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {account.displayName?.charAt(0) || 'W'}
                      </div>
                      <span className="hidden md:inline">
                        {account.displayName}
                        {account.displayBalance
                          ? ` (${account.displayBalance})`
                          : ''}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;