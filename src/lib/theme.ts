import { ThemeConfig } from 'antd';
import { ThemeColor } from '@/types';

export const themeTokens: Record<ThemeColor, { colorPrimary: string; colorInfo: string }> = {
  blue: { colorPrimary: '#2563eb', colorInfo: '#2563eb' },
  green: { colorPrimary: '#16a34a', colorInfo: '#16a34a' },
  purple: { colorPrimary: '#7c3aed', colorInfo: '#7c3aed' },
  pink: { colorPrimary: '#db2777', colorInfo: '#db2777' },
  orange: { colorPrimary: '#ea580c', colorInfo: '#ea580c' },
  indigo: { colorPrimary: '#6366f1', colorInfo: '#6366f1' },
  teal: { colorPrimary: '#14b8a6', colorInfo: '#14b8a6' },
  cyan: { colorPrimary: '#0891b2', colorInfo: '#0891b2' },
  amber: { colorPrimary: '#d97706', colorInfo: '#d97706' },
  emerald: { colorPrimary: '#059669', colorInfo: '#059669' },
  rose: { colorPrimary: '#e11d48', colorInfo: '#e11d48' },
  slate: { colorPrimary: '#475569', colorInfo: '#475569' },
  crimson: { colorPrimary: '#be123b', colorInfo: '#be123b' },
};

export function buildAntdTheme(color: ThemeColor): ThemeConfig {
  const tokens = themeTokens[color];
  return {
    token: {
      colorPrimary: tokens.colorPrimary,
      colorInfo: tokens.colorInfo,
      borderRadius: 8,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      controlHeight: 40,
    },
    components: {
      Layout: {
        siderBg: '#ffffff',
        headerBg: '#ffffff',
        bodyBg: '#f5f5f5',
      },
      Menu: {
        itemBg: 'transparent',
        itemSelectedBg: tokens.colorPrimary + '15',
        itemSelectedColor: tokens.colorPrimary,
        itemHoverBg: '#f5f5f5',
      },
    },
  };
}
