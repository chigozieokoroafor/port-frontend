'use client'

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download } from "lucide-react"
import { Payment, PAYMENT_FILTER_OPTIONS } from "@/lib/types/constant"
import { FilterDropdown } from "@/components/customer-dashboard/filter-dropdown"
import { PaymentStatusBadge, PaymentStatCard, TotalCostIcon, AmountPaidIcon, OutstandingIcon, Pagination } from "@/components/customer-dashboard/payment/status"
import { EmptyState } from "@/components/customer-dashboard/empty-state"
import { paymentApi } from "@/lib/api/payment"
import { useAuth } from "@/lib/context/auth-context"

const PAGE_SIZE = 10

export default function PaymentsPage() {
    const { user } = useAuth()
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState("All")
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchPayments = useCallback(async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            const res = await paymentApi.getUserPaymentHistory(user.id, { page: currentPage, limit: PAGE_SIZE })
            setPayments(res.data)
            setTotalPages(res.meta?.pageCount || Math.ceil((res.meta?.totalCount || res.data.length) / PAGE_SIZE) || 1)
        } catch (error) {
            console.error("Failed to load payment history:", error)
        } finally {
            setLoading(false)
        }
    }, [user?.id, currentPage])

    useEffect(() => {
        fetchPayments()
    }, [fetchPayments])

    const filtered = useMemo(() => {
        return payments.filter(p => {
            const matchesSearch =
                !search ||
                p.paymentId.toLowerCase().includes(search.toLowerCase()) ||
                p.shipmentId?.toLowerCase().includes(search.toLowerCase())
            const matchesFilter =
                filter === "All" || p.status === filter
            return matchesSearch && matchesFilter
        })
    }, [payments, search, filter])

    const isEmpty = payments.length === 0

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-1">
                        Payments
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                        View your payment history and outstanding balances
                    </p>
                </div>
                {/* <Button
                    className="bg-[#2563EB] hover:bg-[#2563EB]/80 text-white shrink-0"
                    onClick={() => {}}
                >
                    Make a Payment
                </Button> */}
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PaymentStatCard
                    amount={isEmpty ? "£0.00" : "£4,150.00"}
                    label="Total Cost"
                    icon={<TotalCostIcon />}
                />
                <PaymentStatCard
                    amount={isEmpty ? "£0.00" : "£3,050.00"}
                    label="Amount Paid"
                    icon={<AmountPaidIcon />}
                />
                <PaymentStatCard
                    amount={isEmpty ? "£0.00" : "£1,100.00"}
                    label="Outstanding Payments"
                    icon={<OutstandingIcon />}
                />
            </div>

            {/* Payment History */}
            {isEmpty ? (
                <EmptyState emptyText="No Payment Activity Found" />
            ) : (
            <Card>
                <CardContent className="p-5 sm:p-6">
                    <h2 className="text-lg font-bold text-[#111827] mb-1">Payment History</h2>
                    <p className="text-sm text-gray-500 mb-5">
                        All payments and transactions for your shipments
                    </p>

                    {/* Search + Filter */}
                    <div className="flex gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search for payment ID or shipment ID"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <FilterDropdown options={PAYMENT_FILTER_OPTIONS} value={filter} onChange={setFilter} />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    {["Payment ID", "Shipment ID", "Date", "Amount", "Status", "Receipt"].map(h => (
                                        <th
                                            key={h}
                                            className="text-left font-semibold text-[#111827] pb-3 pr-6 last:pr-0"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p, i) => (
                                    <tr key={p.id ?? i} className="border-b border-gray-100 last:border-0">
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{p.paymentId}</td>
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{p.shipmentId || '—'}</td>
                                        <td className="py-4 pr-6 text-gray-700 align-middle">
                                            {new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </td>
                                        <td className="py-4 pr-6 text-gray-700 align-middle font-medium">
                                            {p.currency === 'GBP' ? '£' : p.currency === 'USD' ? '$' : p.currency === 'EUR' ? '€' : p.currency}{Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-4 pr-6 align-middle">
                                            <PaymentStatusBadge status={p.status} />
                                        </td>
                                        <td className="py-4 align-middle">
                                            {p.receiptUrl ? (
                                                <a
                                                    href={p.receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                                                    aria-label="Download receipt"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </a>
                                            ) : (
                                                <span className="text-gray-300">
                                                    <Download className="w-5 h-5" />
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination current={currentPage} total={totalPages} onPageChange={setCurrentPage} />
                </CardContent>
            </Card>
            )}
        </div>
    )
}