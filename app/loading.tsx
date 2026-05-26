function SkHeader({ showRight = true }: { showRight?: boolean }) {
  return (
    <header
      className="flex items-center px-4 flex-shrink-0"
      style={{
        height: '56px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid rgba(17,17,16,0.10)',
        boxShadow: '0 1px 0 rgba(17,17,16,0.06)',
      }}
    >
      <div className="sk" style={{ width: '56px', height: '12px' }} />
      <div className="flex-1" />
      {showRight && (
        <div className="flex items-center gap-2">
          <div className="sk" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <div className="sk" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
        </div>
      )}
    </header>
  );
}

function SkSubjectCard() {
  return (
    <div
      className="rounded-xl px-5 py-4 flex items-center justify-between"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(17,17,16,0.08)',
        boxShadow: '0 2px 8px rgba(17,17,16,0.06), 0 1px 2px rgba(17,17,16,0.04)',
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="sk" style={{ width: '120px', height: '14px' }} />
        <div className="sk" style={{ width: '180px', height: '12px', marginTop: '8px' }} />
        <div className="sk" style={{ width: '60px', height: '10px', marginTop: '8px' }} />
      </div>
      <div className="sk ml-2" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#FAFAF6' }}>
      <div className="w-full max-w-[430px] flex flex-col flex-1">
        <SkHeader />
        <main className="flex-1 flex flex-col px-4 py-5 gap-4">
          <div>
            <div className="sk" style={{ width: '90px', height: '28px', borderRadius: '8px' }} />
            <div className="sk" style={{ width: '160px', height: '12px', marginTop: '8px' }} />
          </div>
          <div className="flex flex-col gap-2">
            <SkSubjectCard />
            <SkSubjectCard />
            <SkSubjectCard />
          </div>
        </main>
      </div>
    </div>
  );
}
