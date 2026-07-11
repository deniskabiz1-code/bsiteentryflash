import { HelpCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import { useTelegramPhoto } from '@/hooks/useTelegramPhoto';
import UserAvatar from '@/components/UserAvatar';

interface PageHeaderProps {
  onHelp?: () => void;
}

export default function PageHeader({ onHelp }: PageHeaderProps) {
  const { user } = useApp();
  const { user: tgUser } = useTelegram();
  const photoUrl = useTelegramPhoto();

  const fallbackLetter =
    user?.name?.charAt(0) ||
    tgUser?.first_name?.charAt(0) ||
    'P';

  return (
    <div className="flex items-center justify-between py-2">
      <UserAvatar photoUrl={photoUrl} fallbackLetter={fallbackLetter} size="xs" />
      <button
        type="button"
        onClick={onHelp}
        className="icon-btn text-app-muted"
        aria-label="Помощь"
      >
        <HelpCircle size={18} strokeWidth={2} />
      </button>
    </div>
  );
}