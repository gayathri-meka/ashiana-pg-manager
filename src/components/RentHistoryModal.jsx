import { getMonthRange, formatMonth, currentMonthKey } from '../utils/dateUtils.js'

export default function RentHistoryModal({ tenant, onUpdate, onClose }) {
  const months = getMonthRange(tenant.joiningDate)
  const rentHistory = tenant.rentHistory || {}
  const thisMonth = currentMonthKey()

  function toggleMonth(ym) {
    onUpdate({ rentHistory: { ...rentHistory, [ym]: !rentHistory[ym] } })
  }

  function markCurrentPaid() {
    onUpdate({ rentHistory: { ...rentHistory, [thisMonth]: true } })
  }

  const unpaidCount = months.filter(m => !rentHistory[m]).length
  const paidCount = months.length - unpaidCount

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white w-full max-w-[430px] rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[17px] font-bold">Rent History</h2>
              <p className="text-sm text-gray-500 mt-0.5">{tenant.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200 text-sm"
            >
              ✕
            </button>
          </div>

          {/* Summary pills */}
          <div className="flex gap-2 mt-3">
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
              {paidCount} paid
            </span>
            {unpaidCount > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
                {unpaidCount} unpaid
              </span>
            )}
          </div>
        </div>

        {/* Quick action */}
        <div className="px-5 py-3 border-b border-gray-100 bg-green-50 shrink-0">
          <button
            onClick={markCurrentPaid}
            className="w-full text-white font-semibold py-3 rounded-2xl text-sm active:opacity-90 shadow-md shadow-green-100"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
          >
            Mark {formatMonth(thisMonth)} as Paid
          </button>
        </div>

        {/* Month list */}
        <div className="overflow-y-auto scroll-hidden flex-1 px-5 pb-safe">
          {months.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-10">No months to show.</p>
          )}
          {[...months].reverse().map(ym => {
            const paid = !!rentHistory[ym]
            const isCurrent = ym === thisMonth
            return (
              <label
                key={ym}
                className={`flex items-center justify-between py-4 border-b border-gray-50 last:border-0 cursor-pointer active:bg-gray-50 -mx-5 px-5 ${
                  isCurrent ? 'bg-green-50/60' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{formatMonth(ym)}</span>
                  {isCurrent && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${paid ? 'text-green-600' : 'text-red-400'}`}>
                    {paid ? 'Paid' : 'Unpaid'}
                  </span>
                  <input
                    type="checkbox"
                    checked={paid}
                    onChange={() => toggleMonth(ym)}
                    className="w-5 h-5 rounded accent-green-600"
                  />
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
