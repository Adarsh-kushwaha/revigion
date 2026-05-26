function SkHeaderWithBack({ showRight = false }: { showRight?: boolean }) {
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
      <div className="flex items-center gap-2 -ml-1">
        <div className="sk" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
        <div className="sk" style={{ width: '56px', height: '12px' }} />
      </div>
      <div className="flex-1" />
      {showRight && (
        <div className="sk" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
      )}
    </header>
  );
}

function SkQuestionCard() {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ backgroundColor: 'transparent', border: '1px solid rgba(17,17,16,0.08)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="sk" style={{ width: '144px', height: '14px' }} />
          <div className="sk" style={{ width: '56px', height: '10px', marginTop: '6px' }} />
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="sk"
              style={{ width: '20px', height: '20px', borderRadius: '50%' }}
            />
          ))}
          <div className="sk ml-1" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  );
}

export default function SubjectLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#FAFAF6' }}>
      <div className="w-full max-w-[430px] flex flex-col flex-1">
        <SkHeaderWithBack showRight />
        <div className="px-4 pt-5 pb-3">
          <div className="sk" style={{ width: '160px', height: '28px', borderRadius: '8px' }} />
          <div className="sk" style={{ width: '80px', height: '12px', marginTop: '8px' }} />
        </div>
        <main className="flex-1 flex flex-col px-4 pb-6 gap-2">
          <SkQuestionCard />
          <SkQuestionCard />
          <SkQuestionCard />
          <SkQuestionCard />
        </main>
      </div>
    </div>
  );
}
