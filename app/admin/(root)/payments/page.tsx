'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2 } from "lucide-react"
import { StatCard, SearchFilterBar, Pagination } from "@/components/admin/comp"
import { cn } from "@/lib/utils"
import { paymentApi, AdminPayment } from "@/lib/api/payment"

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentStatus = "Paid" | "Pending" | "Failed" | "Overdue" | "Completed"

const FILTER_OPTIONS = ["All", "Paid", "Pending", "Overdue", "Completed"]
const PAGE_SIZE = 10

// ── Stat Icons ────────────────────────────────────────────────────────────────

function TotalReceivedIcon() {
    return (
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="#16a34a" strokeWidth="1.5" />
                <path d="M2 10h20" stroke="#16a34a" strokeWidth="1.5" />
                <path d="M6 15h4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </div>
    )
}

function PendingPaymentsIcon() {
    return (
        <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#ca8a04" strokeWidth="1.5" />
                <path d="M12 7v5l3 3" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </div>
    )
}

function FailedPaymentsIcon() {
    return (
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#dc2626" strokeWidth="1.5" />
                <path d="M12 8v4M12 16v.5" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
            </svg>
        </div>
    )
}

// ── Payment Status Badge ──────────────────────────────────────────────────────

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
    const styles: Record<PaymentStatus, string> = {
        Paid: "bg-green-100 text-green-700 hover:bg-green-100",
        Completed: "bg-green-100 text-green-700 hover:bg-green-100",
        Pending: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        Failed: "bg-red-100 text-red-700 hover:bg-red-100",
        Overdue: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    }
    return (
        <Badge className={cn("font-medium text-xs px-3 py-1 border-0", styles[status])}>
            {status}
        </Badge>
    )
}

// ── Payment Receipt Dialog ────────────────────────────────────────────────────

function PaymentReceiptDialog({
    open,
    paymentId,
    onClose,
}: {
    open: boolean
    paymentId: string
    onClose: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
            <DialogContent className="sm:max-w-lg rounded-2xl px-8 py-8">
                <DialogTitle className="text-xl font-bold text-[#111827] mb-4">
                    Payment Receipt
                </DialogTitle>

                <Separator className="mb-6" />

                {/* Company header */}
                <div className="flex flex-col items-center gap-2 mb-6">
                    <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                            <rect x="4" y="3" width="14" height="18" rx="2" stroke="#16a34a" strokeWidth="1.5" />
                            <path d="M8 8h8M8 12h8M8 16h5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <p className="text-base font-bold text-[#111827]">Port2Port Global Roro Shipping Ltd</p>
                    <p className="text-sm text-gray-500">Payment Receipt</p>
                    <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Payment Confirmed
                    </div>
                </div>

                <Separator className="mb-5" />

                {/* Receipt Number + Payment Date */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Receipt Number</p>
                        <p className="text-sm font-bold text-[#111827]">{paymentId}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Payment Date</p>
                        <p className="text-sm font-bold text-[#111827]">Jan 26, 2026</p>
                    </div>
                </div>

                <Separator className="mb-5" />

                {/* Bill To */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Bill To</p>
                        <p className="text-sm font-bold text-[#111827]">John Anderson</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Email Address</p>
                        <p className="text-sm font-bold text-[#111827]">customer@email.com</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Phone Number</p>
                        <p className="text-sm font-bold text-[#111827]">+1 (555) 123-4567</p>
                    </div>
                </div>

                <Separator className="mb-5" />

                {/* Payment Details */}
                <div className="mb-5 space-y-3">
                    <p className="text-xs text-gray-400">Payment Details</p>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Shipment ID</span>
                        <span className="text-sm font-bold text-[#111827]">SH-1024</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Payment Method</span>
                        <span className="text-sm font-bold text-[#111827]">Wire Transfer</span>
                    </div>
                </div>

                <Separator className="mb-5" />

                {/* Charges */}
                <div className="mb-5 space-y-3">
                    <p className="text-xs text-gray-400">Charges</p>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Shipping Service</span>
                        <span className="text-sm text-[#111827]">£2,975</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Insurance</span>
                        <span className="text-sm text-[#111827]">£350</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Processing Fee</span>
                        <span className="text-sm text-[#111827]">£175</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-semibold text-[#111827]">Total Amount</span>
                        <span className="text-base font-bold text-[#111827]">£3,500</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                    <Button
                        variant="outline"
                        className="w-full border-[#2563EB] text-[#2563EB] hover:bg-blue-50"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button className="w-full bg-[#2563EB] hover:bg-[#2563EB]/80 text-white">
                        Download PDF
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState("Status")
    const [payments, setPayments] = useState<AdminPayment[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [metrics, setMetrics] = useState({
        totalReceived: 0,
        pendingPayments: 0,
        failedPayments: 0
    })

    const fetchPayments = useCallback(async () => {
        setLoading(true)
        try {
            const [res, metricsRes] = await Promise.all([
                paymentApi.getAdminPayments({
                    page: currentPage,
                    limit: PAGE_SIZE,
                    search: search || undefined,
                    status: filter !== "Status" && filter !== "All" && filter !== "All Payments" ? filter : undefined
                }),
                paymentApi.getAdminPaymentMetrics()
            ])
            setPayments(res.data)
            setTotalPages(res.meta?.pageCount || Math.ceil((res.meta?.totalCount || res.data.length) / PAGE_SIZE) || 1)
            if (metricsRes.data) {
                setMetrics(metricsRes.data)
            }
        } catch (error) {
            console.error("Failed to load admin payments:", error)
        } finally {
            setLoading(false)
        }
    }, [currentPage, search, filter])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPayments()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchPayments])

    useEffect(() => {
        setCurrentPage(1)
    }, [search, filter])

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-1">Payments</h1>
                <p className="text-gray-600 text-sm sm:text-base">Track and manage financial transactions</p>
            </div>

            {/* Stat Cards — currency values */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard 
                    count={`$${metrics.totalReceived}` as any} 
                    label="Total Received" 
                    icon={<TotalReceivedIcon />} 
                />
                <StatCard 
                    count={`$${metrics.pendingPayments}` as any} 
                    label="Pending Payments" 
                    icon={<PendingPaymentsIcon />} 
                />
                <StatCard 
                    count={`$${metrics.failedPayments}` as any} 
                    label="Failed Payments" 
                    icon={<FailedPaymentsIcon />} 
                />
            </div>

            {/* Payments Table */}
            <Card>
                <CardContent className="p-5 sm:p-6">
                    <div className="mb-6">
                        <SearchFilterBar
                            search={search}
                            onSearchChange={setSearch}
                            filterValue={filter}
                            onFilterChange={setFilter}
                            searchPlaceholder="Search by customer name, shipment ID or payment ID..."
                            filterOptions={FILTER_OPTIONS}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    {["Payment ID", "Customer Name", "Shipment ID", "Amount", "Status", "Action"].map((h) => (
                                        <th key={h} className="text-left font-semibold text-[#111827] pb-3 pr-6 last:pr-0">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p) => (
                                    <tr key={p.id} className="border-b border-gray-100 last:border-0">
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{p.paymentId || p.id}</td>
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{p.customerName}</td>
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{p.shipmentId || '—'}</td>
                                        <td className="py-4 pr-6 text-gray-700 align-middle">
                                            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: p.currency || 'GBP' }).format(p.amount)}
                                        </td>
                                        <td className="py-4 pr-6 align-middle">
                                            <PaymentStatusBadge status={p.status as PaymentStatus} />
                                        </td>
                                        <td className="py-4 align-middle">
                                            {p.receiptUrl ? (
                                                <a
                                                    href={p.receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#2563EB] text-sm font-medium hover:underline whitespace-nowrap"
                                                >
                                                    View Receipt
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-sm">No Receipt</span>
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
        </div>
    )
}