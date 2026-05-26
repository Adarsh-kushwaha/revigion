function SkHeaderWithBack() {
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
    </header>
  );
}

function SkField({ labelWidth, rows = 1 }: { labelWidth: number; rows?: number }) {
  return (
    <div>
      <div className="sk" style={{ width: `${labelWidth}px`, height: '10px', marginBottom: '6px' }} />
      <div
        className="sk"
        style={{
          width: '100%',
          height: rows > 1 ? `${rows * 24 + 16}px` : '36px',
          borderRadius: '10px',
        }}
      />
    </div>
  );
}

export default function QuestionLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#FAFAF6' }}>
      <div className="w-full max-w-[430px] flex flex-col flex-1">
        <SkHeaderWithBack />
        <main className="flex-1 flex flex-col px-4 py-5 gap-5">
          {/* Completed X / Remaining Y */}
          <div className="sk" style={{ width: '160px', height: '12px' }} />

          {/* Editable fields */}
          <div className="flex flex-col gap-4">
            <SkField labelWidth={24} />
            <SkField labelWidth={56} />
            <SkField labelWidth={68} rows={3} />
          </div>

          {/* Revision action card */}
          <div
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{
              backgroundColor: '#F5F5F1',
              border: '1px solid rgba(17,17,16,0.08)',
            }}
          >
            <div className="sk" style={{ width: '120px', height: '14px' }} />
            <div className="sk" style={{ width: '100%', height: '40px', borderRadius: '10px' }} />
          </div>
        </main>
      </div>
    </div>
  );
}
