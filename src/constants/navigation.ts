export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
}

export const SIDEBAR_NAV_ITEMS: NavigationItem[] = [
  { label: 'Dashboard', href: '/overview', icon: 'dashboard' },
  { label: 'Salaries', href: '/compensation', icon: 'currency_exchange' },
  { label: 'Level Matrix', href: '/levels', icon: 'layers' },
  { label: 'Compare', href: '/compare', icon: 'compare_arrows' },
  { label: 'Companies', href: '/companies', icon: 'business' }
];
