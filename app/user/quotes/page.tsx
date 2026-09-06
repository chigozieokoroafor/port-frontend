'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { TabFilter, QuoteRequest } from "@/lib/types/constant"
import { Pagination } from "@/components/user-shipment/pagination"
import { AllIcon, CompletedIcon, FailedIcon, PendingIcon, StatCard } from "@/components/user-shipment/status-icon"
import { StatusBadge } from "@/components/customer-dashboard/quotes/statusbar"
import { QuoteTab } from "@/components/user-shipment/bars"
import { EmptyState } from "@/components/customer-dashboard/empty-state"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { quoteApi } from "@/lib/api/quotes"
import { paymentApi } from "@/lib/api/payment"
import { useAuth } from '@/lib/context/auth-context'
import { useToast } from "@/hooks/use-toast"

const STATUS_TO_TAB: Record<string, TabFilter> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
}

function computeStats(requests: QuoteRequest[]) {
    return requests
    .reduce(
        (acc, q) => {
            acc.all++
            if (q.status === "Approved") acc.approved++
            else if (q.status === "Rejected") acc.rejected++
            else if (q.status === "Pending") acc.pending++
            return acc
        },
        { all: 0, pending: 0, approved: 0, rejected: 0 }
    )
}

function formatVehicle(info?: Record<string, any>): string {
    if (!info) return "—"
    const { make, model, year } = info
    return [make, model, year].filter(Boolean).join(" ")
}

function formatRoute(info?: Record<string, any>): string {
    if (!info) return "—"
    const { originCountry, destinationCountry } = info
    if (originCountry && destinationCountry) return `${originCountry}\n→ ${destinationCountry}`
    return "—"
}


interface MyQuotesPageProps {
    isEmpty?: boolean
}

const PAGE_SIZE = 10

export default function MyQuotesPage({ isEmpty = false }: Readonly<MyQuotesPageProps>) {

    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<TabFilter>("All")
    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)

    const [requests, setRequests] = useState<QuoteRequest[]>([])
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(!isEmpty)
    const [error, setError] = useState<string | null>(null)
    const [paymentLoadingId, setPaymentLoadingId] = useState<string | null>(null)

    const router = useRouter()
    const { toast } = useToast()

    const fetchQuotes = useCallback(async () => {
        if (isEmpty || !user?.id) return
        setLoading(true)
        setError(null)
        try {
            const res = await quoteApi.getUserQuoteRequests(user.id, { page: currentPage, limit: PAGE_SIZE })
            setRequests(res.data?.quoteRequests ?? [])
            if (res.data?.meta) {
                setTotalPages(res.data.meta.pageCount || 1)
            }
        } catch {
            setError("Failed to load quotes. Please try again.")
        } finally {
            setLoading(false)
        }
    }, [isEmpty, user?.id, currentPage])

    useEffect(() => {
        fetchQuotes()
    }, [fetchQuotes])


    const stats = isEmpty ? { all: 0, approved: 0, pending: 0, rejected: 0 } : computeStats(requests)

    const filtered = requests.filter((q) => {
        const s = q.status.toLowerCase()
        const matchesTab = activeTab === "All" || STATUS_TO_TAB[s] === activeTab

        const vehicle = formatVehicle(q.vehicle).toLowerCase()
        const route = formatRoute(q.route).toLowerCase()
        const matchesSearch =
            !search ||
            q.referenceId.toLowerCase().includes(search.toLowerCase()) ||
            vehicle.includes(search.toLowerCase()) ||
            route.includes(search.toLowerCase()) ||
            s.includes(search.toLowerCase())

        return matchesTab && matchesSearch
    })

    const paginated = filtered

    // Reset to page 1 when tab or search changes
    useEffect(() => { setCurrentPage(1) }, [activeTab, search])

    function onViewDetails(id: string) {
        router.push(`/user/quotes/${id}`)
    }

    async function handleProceedToPay(quoteId: string) {
        if (!quoteId) return
        setPaymentLoadingId(quoteId)
        try {
            const res = await paymentApi.createPaymentV2({
                quoteId,
                paymentMethod: "stripe"
            })
            if (res.data?.checkoutUrl) {
                window.location.href = res.data.checkoutUrl
            } else {
                throw new Error("No checkout URL returned")
            }
        } catch (err: any) {
            toast({
                title: "Payment Error",
                description: err?.message || "Failed to initiate payment. Please try again.",
                variant: "destructive"
            })
        } finally {
            setPaymentLoadingId(null)
        }
    }


    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-1">
                        My Quotes
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Manage and track all your vehicle quotes
                    </p>
                </div>
                <Link href="/user/quotes/request">
                    <Button className="bg-[#2563EB] hover:bg-[#2563EB]/80 text-white shrink-0">
                        Request a Quote
                    </Button>
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard count={stats.all}    label="All Quotes"    icon={<AllIcon />}    />
                <StatCard count={stats.approved} label="Approved Quotes" icon={<CompletedIcon />} />
                <StatCard count={stats.pending}   label="Pending Quotes"   icon={<PendingIcon />}   />
                <StatCard count={stats.rejected}    label="Rejected Quotes"    icon={<FailedIcon />}    />
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-16 text-gray-500 text-sm">
                    Loading quotes…
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="flex flex-col items-center gap-3 py-16 text-sm text-red-600">
                    <p>{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchQuotes}>
                        Retry
                    </Button>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && (isEmpty || requests.length === 0) && (
                <EmptyState emptyText="No Quotes Found" />
            )}

            {/* Content */}
            {!loading && !error && !isEmpty && requests.length > 0 && (
                <>
                    <QuoteTab active={activeTab} onChange={setActiveTab} />

                    <Card>
                        <CardContent className="p-5 sm:p-6">
                            <h2 className="text-lg font-bold text-[#111827] mb-5">{activeTab === "All" ? "All Quotes" : activeTab + " Quotes"}</h2>

                            {/* Search + Filter */}
                            <div className="flex gap-3 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by reference ID, route or status"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                {/* <FilterDropdown options={QUOTE_FILTER_OPTIONS} value={filter} onChange={setFilter} /> */}
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            {["Reference ID", "Customer", "Vehicle", "Route", "Status", "Submitted"].map(h => (
                                                <th
                                                    key={h}
                                                    className="text-left font-semibold text-[#111827] pb-3 pr-6 last:pr-0"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                            <th className="pb-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                                                    No quotes match your search.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginated.map((q) => (
                                                <tr key={q._id || q.id} className="border-b border-gray-100 last:border-0">
                                                    <td className="py-4 pr-6 text-gray-700 align-top font-mono text-xs">
                                                        {q.referenceId}
                                                    </td>
                                                    <td className="py-4 pr-6 text-gray-700 align-top">
                                                        {q.customer?.name || q.customer?.fullName || '—'}
                                                    </td>
                                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-line">
                                                        {formatVehicle(q.vehicle)}
                                                    </td>
                                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-line">
                                                        {formatRoute(q.route)}
                                                    </td>
                                                    <td className="py-4 pr-6 align-top">
                                                        <StatusBadge status={q.status as any} />
                                                    </td>
                                                    <td className="py-4 pr-6 text-gray-700 align-top">
                                                        {new Date(q.createdAt).toLocaleDateString("en-GB")}
                                                    </td>
                                                    <td className="py-4 align-top">
                                                        {q.quotes && q.quotes.status?.toLowerCase() === "pending" && (
                                                            <Button
                                                                size="sm"
                                                                className="bg-[#2563EB] hover:bg-[#2563EB]/80 text-white"
                                                                disabled={paymentLoadingId === q.quotes.id}
                                                                onClick={() => handleProceedToPay(q.quotes?.id)}
                                                            >
                                                                {paymentLoadingId === q.quotes.id ? "Loading..." : "Proceed to Pay"}
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                current={currentPage}
                                total={totalPages}
                                onChange={setCurrentPage}
                            />
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}