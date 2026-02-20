import { getMonthRange, formatMonth, currentMonthKey } from '../utils/dateUtils.js'

export default function RentHistoryModal({ tenant, onUpdate, onClose }) {
  const months = getMonthRange(tenant.joiningDate)
  const rentHistory = tenant.rentHistory || {}
  const thisMonth = currentMonthKey()

  function toggleMonth(ym) {
    const updated = { ...rentHistory, [ym]: !rentHistory[ym] }
    onUpdate({ rentHistory: updated })
  }

  function markCurrentPaid() {
    const updated = { ...rentHistory, [thisMonth]: true }
    onUpdate({ rentHistory: updated })
  }

  const unpaidCount = months.filter(m => !rentHistory[m]).length

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Rent History</h2>
            <p className="text-sm text-gray-500">{tenant.name}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">{unpaidCount} unpaid</div>
            <button
              onClick={onClose}
              className="text-gray-400 text-xl leading-none mt-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick action */}
        <div className="px-4 py-3 border-b bg-green-50">
          <button
            onClick={markCurrentPaid}
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl active:bg-green-700 transition-colors text-sm"
          >
            Mark {formatMonth(thisMonth)} as Paid
          </button>
        </div>

        {/* Month list */}
        <div className="overflow-y-auto flex-1 px-4 py-2">
          {months.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No months to show.</p>
          )}
          {[...months].reverse().map(ym => {
            const paid = !!rentHistory[ym]
            const isCurrent = ym === thisMonth
            return (
              <label
                key={ym}
                className={`flex items-center justify-between py-4 border-b last:border-0 cursor-pointer active:bg-gray-50 ${isCurrent ? 'bg-green-50 -mx-4 px-4' : ''}`}
              >
                <div>
                  <span className="font-medium text-sm">{formatMonth(ym)}</span>
                  {isCurrent && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${paid ? 'text-green-600' : 'text-red-500'}`}>
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
