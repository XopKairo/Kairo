import {
  CircleIcon,
  DashboardIcon,
  UsersIcon,
  VideoIcon,
  CashIcon,
  AlertTriangleIcon,
  UserCheckIcon,
  PaletteIcon,
  WindmillIcon,
  HelpIcon,
  TypographyIcon
} from 'vue-tabler-icons';

export interface menu {
  header?: string;
  title?: string;
  icon?: object;
  to?: string;
  divider?: boolean;
  chip?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
}

const sidebarItem: menu[] = [
  { header: 'DASHBOARD' },
  { title: 'Home', icon: DashboardIcon, to: '/dashboard/default' },
  { divider: true },
  { header: 'USER MANAGEMENT' },
  { title: 'Users List', icon: UsersIcon, to: '/admin/users/list' },
  { title: 'Host Management', icon: UserCheckIcon, to: '/admin/hosts/list' },
  { title: 'Agencies', icon: UserCheckIcon, to: '/admin/agencies' },
  { divider: true },
  { header: 'ECONOMY' },
  { title: 'Coin Packages', icon: CashIcon, to: '/admin/economy/packages' },
  { title: 'Gifts & Pricing', icon: PaletteIcon, to: '/admin/gifts' },
  { title: 'Payout Requests', icon: CashIcon, to: '/admin/hosts/payouts' },
  { divider: true },
  { header: 'OPERATIONS' },
  { title: 'Live Wall', icon: VideoIcon, to: '/admin/monitoring' },
  { title: 'Call History', icon: VideoIcon, to: '/admin/calls/history' },
  { title: 'Banners', icon: TypographyIcon, to: '/admin/banners' },
  { title: 'Marketing', icon: WindmillIcon, to: '/admin/marketing/notifications' },
  { divider: true },
  { header: 'SYSTEM' },
  { title: 'Support Tickets', icon: HelpIcon, to: '/admin/support' },
  { title: 'Reports & Bans', icon: AlertTriangleIcon, to: '/admin/reports' },
  { title: 'App Settings', icon: WindmillIcon, to: '/admin/settings' },
  { title: 'Ad Settings', icon: CashIcon, to: '/admin/ads' }
];

export default sidebarItem;
