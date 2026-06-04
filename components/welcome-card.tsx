interface WelcomeCardProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  greeting: string;
}

function initial(s: string): string {
  return s.trim().charAt(0).toUpperCase() || '?';
}

function emojiFor(greeting: string): string {
  if (greeting.includes('morning')) return '☀️';
  if (greeting.includes('afternoon')) return '⛅';
  return '🌙';
}

export function WelcomeCard({ name, email, avatarUrl, greeting }: WelcomeCardProps) {
  const displayName = name || email.split('@')[0];
  const emoji = emojiFor(greeting);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F4F1EA 100%)',
        border: '1px solid rgba(17,17,16,0.08)',
        boxShadow: '0 2px 8px rgba(17,17,16,0.06), 0 1px 2px rgba(17,17,16,0.04)',
        padding: '14px',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-50px',
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,180,80,0.18) 0%, rgba(255,180,80,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-40px',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(80,140,220,0.10) 0%, rgba(80,140,220,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative flex items-center gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            referrerPolicy="no-referrer"
            width={48}
            height={48}
            className="rounded-full flex-shrink-0"
            style={{
              objectFit: 'cover',
              border: '1.5px solid #FFFFFF',
              boxShadow: '0 2px 8px rgba(17,17,16,0.12)',
            }}
          />
        ) : (
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full text-base font-semibold"
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #FFD27A 0%, #FF9A6B 100%)',
              color: '#FFFFFF',
              border: '1.5px solid #FFFFFF',
              boxShadow: '0 2px 8px rgba(17,17,16,0.12)',
            }}
            aria-hidden="true"
          >
            {initial(displayName)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true" style={{ fontSize: '12px' }}>{emoji}</span>
            <p className="text-[11px] font-semibold" style={{ color: '#6B6A65' }}>
              {greeting}
            </p>
          </div>
          <p
            className="text-[16px] font-semibold truncate leading-tight mt-1"
            style={{ color: '#111110' }}
          >
            {displayName}
          </p>
          <p className="text-[11px] truncate mt-0.5" style={{ color: '#9C9B95' }}>
            {email}
          </p>
        </div>
      </div>
    </div>
  );
}
