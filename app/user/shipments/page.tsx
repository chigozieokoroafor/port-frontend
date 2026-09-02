'use client'

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { FILTER_OPTIONS, Shipment, TabFilter } from "@/lib/types/constant"
import { ActiveIcon, CompletedIcon, FailedIcon, PendingIcon, StatCard, StatusBadge } from "@/components/user-shipment/status-icon"
import { ShipmentTab } from "@/components/user-shipment/bars"
import { FilterDropdown } from "@/components/customer-dashboard/filter-dropdown"
import { EmptyState } from "@/components/customer-dashboard/empty-state"
import { Pagination } from "@/components/customer-dashboard/payment/status" // Using this Pagination since user-shipment pagination wasn't verified fully
import Link from "next/link"
import { useRouter } from "next/navigation"
import { shipmentApi } from "@/lib/api/shipment"
import { useAuth } from "@/lib/context/auth-context"

const PAGE_SIZE = 10

export default function MyShipmentsPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<TabFilter>("All")
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState("All Shipments")
    const [shipments, setShipments] = useState<Shipment[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    
    const router = useRouter()

    const fetchShipments = useCallback(async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            const activeStatus = activeTab !== "All" ? activeTab : (filter !== "All Shipments" ? filter : undefined)
            
            const res = await shipmentApi.getUserShipments(user.id, { 
                page: currentPage, 
                limit: PAGE_SIZE,
                search: search || undefined,
                status: activeStatus
            })
            
            setShipments(res.data)
            setTotalPages(res.meta?.pageCount || Math.ceil((res.meta?.totalCount || res.data.length) / PAGE_SIZE) || 1)
        } catch (error) {
            console.error("Failed to load shipments:", error)
        } finally {
            setLoading(false)
        }
    }, [user?.id, currentPage, search, activeTab, filter])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchShipments()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchShipments])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [search, activeTab, filter])

    const stats = { active: 0, completed: 0, pending: 0, failed: 0 }
    const isEmpty = shipments.length === 0 && !loading && !search && activeTab === "All" && filter === "All Shipments"

    function onViewDetails(id: string) {
        router.push(`/user/shipments/${id}`)
    }

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-1">
                        My Shipments
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Manage and track all your vehicle shipments
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
                <StatCard count={stats.active} label="Active Shipments" icon={<ActiveIcon />} />
                <StatCard count={stats.completed} label="Completed Shipments" icon={<CompletedIcon />} />
                <StatCard count={stats.pending} label="Pending Shipments" icon={<PendingIcon />} />
                <StatCard count={stats.failed} label="Failed Shipments" icon={<FailedIcon />} />
            </div>
            {isEmpty ? (
                <EmptyState emptyText="No Shipment Found" />
            ) : (
                <>
                    {/* Tab Bar */}
                    <ShipmentTab active={activeTab} onChange={setActiveTab} />

                    {/* Content */}
                    <Card>
                        <CardContent className="p-5 sm:p-6">
                            <h2 className="text-lg font-bold text-[#111827] mb-5">All Shipments</h2>

                            {/* Search + Filter */}
                            <div className="flex gap-3 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Search for shipment ID, route or status"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <FilterDropdown options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            {["Shipment ID", "Vehicle", "Route", "Status", "Estimated Arrival", "Action"].map(h => (
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
                                        {shipments.map((s, i) => (
                                            <tr key={i + 1} className="border-b border-gray-100 last:border-0">
                                                <td className="py-4 pr-6 text-gray-700 align-top">{s.shipmentId || s.id}</td>
                                                <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-line">{s.vehicle}</td>
                                                <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-line">{s.route}</td>
                                                <td className="py-4 pr-6 align-top">
                                                    <StatusBadge status={s.status} />
                                                </td>
                                                <td className="py-4 pr-6 text-gray-700 align-top">{s.estimatedArrival || '—'}</td>
                                                <td className="py-4 align-top">
                                                    <button
                                                        onClick={() => onViewDetails(s.id)}
                                                        className="text-[#2563EB] text-sm font-medium hover:underline whitespace-nowrap"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination current={currentPage} total={totalPages} onPageChange={setCurrentPage} />
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}