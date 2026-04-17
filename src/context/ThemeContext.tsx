'use client';

import React, { createContext, useContext, useState } from 'react';
import { ConfigProvider, App } from 'antd';
import { ThemeColor, Tenant } from '@/types';
import { buildAntdTheme } from '@/lib/theme';

interface ThemeContextValue {
  color: ThemeColor;
  setColor: (c: ThemeColor) => void;
  applyTenantTheme: (tenant: Tenant) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AntdProvider({ children }: { children: React.ReactNode }) {
  const [color, setColorState] = useState<ThemeColor>('blue');

  const setColor = (c: ThemeColor) => {
    setColorState(c);
  };

  const applyTenantTheme = (tenant: Tenant) => {
    if (tenant.branding?.primaryColor) {
      setColor(tenant.branding.primaryColor);
    }
    if (tenant.branding?.favicon) {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
        || Object.assign(document.createElement('link'), { rel: 'icon' });
      link.href = tenant.branding.favicon;
      document.head.appendChild(link);
    }
  };

  return (
    <ThemeContext.Provider value={{ color, setColor, applyTenantTheme }}>
      <ConfigProvider theme={buildAntdTheme(color)}>
        <App>
          {children}
        </App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

// Keep ThemeProvider as alias for backwards compat in imports
export const ThemeProvider = AntdProvider;

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within AntdProvider');
  return ctx;
};
