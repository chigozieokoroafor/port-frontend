'use client'

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard, QuoteIcon, AllQuotesIcon, AcceptedIcon, PendingIcon, QuoteStatusBadge, SearchFilterBar, Pagination } from "@/components/admin/comp"
import { FILTER_OPTIONS } from "@/components/admin/type"
import { adminQuoteApi, quoteApi } from "@/lib/api/quotes"
import { QuoteRequest } from "@/lib/types/constant"
import { useRouter } from "next/navigation"
import Link from "next/link"

const PAGE_SIZE = 10

const isNew = (status: string) => status === "New" || status === "Pending"


export default function AdminQuotesPage() {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState(FILTER_OPTIONS[0])
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [metrics, setMetrics] = useState({
        newQuotes: 0,
        allQuotes: 0,
        acceptedQuotes: 0,
        pendingQuotes: 0
    })
    const router = useRouter()

    const fetchQuotes = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [res, metricsRes] = await Promise.all([
                adminQuoteApi.getAllQuotes({
                    page: currentPage,
                    limit: PAGE_SIZE,
                    search: search || undefined
                }),
                adminQuoteApi.getMetrics()
            ])
            setRequests(res.data?.quoteRequests ?? [])
            setTotalPages(res.data?.meta?.pageCount || Math.ceil((res.data?.meta?.totalCount || res.data?.quoteRequests?.length || 0) / PAGE_SIZE) || 1)
            
            if (metricsRes.data) {
                setMetrics(metricsRes.data)
            }
        } catch (err) {
            console.error("Failed to load quotes.", err)
            setError("Failed to load quotes. Please try again.")
        } finally {
            setLoading(false)
        }
    }, [currentPage, search])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchQuotes()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchQuotes])

    // Reset to page 1 whenever search or filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [search, filter])

    const filtered = useMemo(() => {
        return requests.filter(q => {
            const matchesFilter =
                !filter ||
                filter === FILTER_OPTIONS[0] || // "All Quotes" option
                q.status === filter ||
                (filter === "Pending Quotes" && q.status === "Pending") ||
                (filter === "Approved Quotes" && q.status === "Approved") ||
                (filter === "Rejected Quotes" && q.status === "Rejected")

            return matchesFilter
        })
    }, [requests, filter])

    if (error) return <div>Error: {error}</div>

    return (
        <div className="space-y-6 lg:space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-1">Quotes</h1>
                <p className="text-gray-600 text-sm sm:text-base">
                    Review and manage customer quote requests
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard count={metrics.newQuotes} label="New Quotes" icon={<QuoteIcon />} />
                <StatCard count={metrics.allQuotes} label="All Quotes" icon={<AllQuotesIcon />} />
                <StatCard count={metrics.acceptedQuotes} label="Accepted Quotes" icon={<AcceptedIcon />} />
                <StatCard count={metrics.pendingQuotes} label="Pending Quotes" icon={<PendingIcon />} />
            </div>

            <Card className="bg-[#F8FAFC] border-[0.5px] border-[#999999]">
                <CardContent className="p-5 sm:p-6">
                    <div className="mb-6">
                        <SearchFilterBar
                            search={search}
                            onSearchChange={setSearch}
                            filterValue={filter}
                            onFilterChange={setFilter}
                            searchPlaceholder="Search by customer, vehicle or quote ID"
                            filterOptions={FILTER_OPTIONS}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-[0.5px] border-[#6B7280]">
                                    {["Quote ID", "Customer Name", "Vehicle", "Route", "Status", "Action"].map(h => (
                                        <th key={h} className="text-left font-semibold text-[#111827] pb-3 pr-6 last:pr-0">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((q, i) => (
                                    <tr key={q.id ?? q._id ?? i} className="border-b-[0.5px] border-[#BFBFBF] last:border-0">
                                        <td className="py-4 pr-6 text-[#6B7280] align-middle">{q.referenceId}</td>
                                        <td className="py-4 pr-6 text-[#6B7280] align-middle">{q.customerName}</td>
                                        <td className="py-4 pr-6 text-[#6B7280] align-middle">{q.vehicle}</td>
                                        <td className="py-4 pr-6 text-[#6B7280] align-middle">{q.route}</td>
                                        <td className="py-4 pr-6 align-middle">
                                            <QuoteStatusBadge status={isNew(q.status) ? "New" : q.status} />
                                        </td>
                                        <td className="py-4 align-middle">
                                            {q.id || q._id ? (
                                                <Link
                                                    href={`/admin/quotes/${q.id || q._id}`}
                                                    className="text-[#2563EB] text-sm font-medium hover:underline whitespace-nowrap"
                                                >
                                                    View Details
                                                </Link>
                                            ) : (
                                                <span className="text-gray-400 text-sm whitespace-nowrap">Missing ID</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                </CardContent>
            </Card>
        </div>
    )
}