import { CONTENT_PAGES_BY_PATH } from '@/content/pages';
import { ContentPageView } from '@/components/ContentPageView';
import { useLocation } from 'react-router-dom';
import NotFound from './NotFound';

/** Renders any data-driven content page based on the current path. */
export default function ContentPage() {
  const { pathname } = useLocation();
  const page = CONTENT_PAGES_BY_PATH[pathname] ?? CONTENT_PAGES_BY_PATH[pathname.replace(/\/$/, '')];
  if (!page) return <NotFound />;
  return <ContentPageView page={page} />;
}
