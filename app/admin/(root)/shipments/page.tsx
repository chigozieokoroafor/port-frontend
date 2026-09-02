'use client'

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard, SearchFilterBar, Pagination } from "@/components/admin/comp"
import { cn } from "@/lib/utils"
import { shipmentApi, AdminShipment } from "@/lib/api/shipment"
import { useRouter } from "next/navigation"

// ── Types ─────────────────────────────────────────────────────────────────────

type ShipmentStatus = "In Transit" | "Delivered" | "Custom Clearance" | "Delayed" | "Port of Origin" | "Port of Destination"

const FILTER_OPTIONS = ["All", "Active", "Completed", "Delayed"]
const PAGE_SIZE = 10

// ── Stat Icons ────────────────────────────────────────────────────────────────

function AllShipmentsIcon() {
    return (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 22V12h6v10" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    )
}

function ActiveShipmentsIcon() {
    return (
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#2563EB" strokeWidth="1.5" />
                <path d="M8 12l3 3 5-5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    )
}

function CompletedShipmentsIcon() {
    return (
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#16a34a" strokeWidth="1.5" />
                <path d="M8 12l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    )
}

function DelayedShipmentsIcon() {
    return (
        <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#ca8a04" strokeWidth="1.5" />
                <path d="M12 7v5l3 3" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </div>
    )
}

// ── Shipment Status Badge ─────────────────────────────────────────────────────

function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
    const styles: Record<ShipmentStatus, string> = {
        "In Transit": "bg-blue-100 text-blue-700 hover:bg-blue-100 border-0",
        "Delivered": "bg-green-100 text-green-700 hover:bg-green-100 border-0",
        "Custom Clearance": "bg-purple-100 text-purple-700 hover:bg-purple-100 border-0",
        "Delayed": "bg-red-100 text-red-700 hover:bg-red-100 border-0",
        "Port of Origin": "bg-gray-100 text-gray-700 hover:bg-gray-100 border-0",
        "Port of Destination": "bg-orange-100 text-orange-700 hover:bg-orange-100 border-0",
    }
    return (
        <Badge className={cn("font-medium text-xs px-3 py-1", styles[status])}>
            {status}
        </Badge>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface AdminShipmentsPageProps {
    onViewDetails?: (shipmentId: string) => void
}

export default function AdminShipmentsPage({ onViewDetails }: AdminShipmentsPageProps) {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState("Status")
    const [shipments, setShipments] = useState<AdminShipment[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const router = useRouter()

    const fetchShipments = useCallback(async () => {
        setLoading(true)
        try {
            const res = await shipmentApi.getAdminShipments({
                page: currentPage,
                limit: PAGE_SIZE,
                search: search || undefined,
                status: filter !== "Status" && filter !== "All" ? filter : undefined
            })
            
            setShipments(res.data)
            setTotalPages(res.meta?.pageCount || Math.ceil((res.meta?.totalCount || res.data.length) / PAGE_SIZE) || 1)
        } catch (error) {
            console.error("Failed to load shipments:", error)
        } finally {
            setLoading(false)
        }
    }, [currentPage, search, filter])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchShipments()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchShipments])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [search, filter])

    const handleViewDetails = (id: string) => {
        if (onViewDetails) {
            onViewDetails(id)
        } else {
            router.push(`/admin/shipments/${id}`)
        }
    }

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-1">Shipments</h1>
                <p className="text-gray-600 text-sm sm:text-base">Create and manage active shipments</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard count={25} label="All Shipments" icon={<AllShipmentsIcon />} />
                <StatCard count={25} label="Active Shipments" icon={<ActiveShipmentsIcon />} />
                <StatCard count={25} label="Completed Shipments" icon={<CompletedShipmentsIcon />} />
                <StatCard count={25} label="Delayed Shipments" icon={<DelayedShipmentsIcon />} />
            </div>

            {/* Shipments Table */}
            <Card>
                <CardContent className="p-5 sm:p-6">
                    {/* Search + Filter */}
                    <div className="mb-6">
                        <SearchFilterBar
                            search={search}
                            onSearchChange={setSearch}
                            filterValue={filter}
                            onFilterChange={setFilter}
                            searchPlaceholder="Search by customer, vehicle or shipment ID"
                            filterOptions={FILTER_OPTIONS}
                        />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    {["Shipment ID", "Customer Name", "Vehicle", "Route", "Status", "Action"].map((h) => (
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
                                    <tr key={s.id ?? i} className="border-b border-gray-100 last:border-0">
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{s.shipmentId || s.id}</td>
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{s.customerName}</td>
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{s.vehicle}</td>
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{s.route}</td>
                                        <td className="py-4 pr-6 align-middle">
                                            <ShipmentStatusBadge status={s.status as ShipmentStatus} />
                                        </td>
                                        <td className="py-4 align-middle">
                                            <button
                                                onClick={() => handleViewDetails(s.id)}
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
        </div>
    )
}