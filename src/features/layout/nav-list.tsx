'use client';

import GroupOutlined from '@mui/icons-material/GroupOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined';
import TrendingUp from '@mui/icons-material/TrendingUp';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import type SvgIcon from '@mui/material/SvgIcon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@/types/domain';
import { isActivePath, navItemsFor, type NavIcon, type NavItem } from './nav-items';

const ICONS: Record<NavIcon, typeof SvgIcon> = {
  overview: SpaceDashboardOutlined,
  sales: TrendingUp,
  purchases: Inventory2Outlined,
  access: VisibilityOutlined,
  profile: PersonOutlined,
  users: GroupOutlined,
  audit: HistoryOutlined,
};

type NavListProps = { role: Role; onNavigate?: () => void };

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return items.map(({ href, label, icon }) => {
    const Icon = ICONS[icon];
    const active = isActivePath(href, pathname);
    return (
      <ListItemButton
        key={href}
        component={Link}
        href={href}
        selected={active}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
        sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
      >
        <ListItemIcon sx={{ minWidth: 36, color: active ? 'primary.main' : undefined }}>
          <Icon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={label} />
      </ListItemButton>
    );
  });
}

/** Navegação principal: itens comuns e, para admin, a seção de administração. */
export function NavList({ role, onNavigate }: NavListProps) {
  const pathname = usePathname();
  const items = navItemsFor(role);
  const common = items.filter((item) => !item.adminOnly);
  const admin = items.filter((item) => item.adminOnly);

  return (
    <nav aria-label="Menu principal">
      <List dense>
        <NavLinks items={common} pathname={pathname} onNavigate={onNavigate} />
      </List>
      {admin.length > 0 && (
        <>
          <Divider sx={{ mx: 2, my: 1 }} />
          <List dense subheader={<ListSubheader disableSticky>Administração</ListSubheader>}>
            <NavLinks items={admin} pathname={pathname} onNavigate={onNavigate} />
          </List>
        </>
      )}
    </nav>
  );
}
