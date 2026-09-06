'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard, SearchFilterBar, Pagination } from "@/components/admin/comp"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { adminCustomerApi, AdminCustomerListItem } from "@/lib/api/customer"

// ── Types ─────────────────────────────────────────────────────────────────────

type CustomerStatus = "Active" | "Inactive"

// ── Constants ─────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = ["All", "Active", "Inactive"]
const PAGE_SIZE = 10

// ── Stat Icons ────────────────────────────────────────────────────────────────

function InactiveCustomersIcon() {
    return (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" stroke="#6b7280" strokeWidth="1.5" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </div>
    )
}

function ActiveCustomersIcon() {
    return (
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" stroke="#16a34a" strokeWidth="1.5" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </div>
    )
}

// ── Customer Status Badge ─────────────────────────────────────────────────────

function CustomerStatusBadge({ status }: Readonly<{ status: CustomerStatus }>) {
    return (
        <Badge
            className={cn(
                "font-medium text-xs px-3 py-1 border-0 hover:opacity-90",
                status === "Active"
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-100"
            )}
        >
            {status}
        </Badge>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface AdminCustomersPageProps {
    onViewDetails?: (customerId: string) => void
}

export default function AdminCustomersPage({ onViewDetails }: Readonly<AdminCustomersPageProps>) {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState("Status")
    const [customers, setCustomers] = useState<AdminCustomerListItem[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [metrics, setMetrics] = useState({
        all: 0,
        active: 0,
        inactive: 0
    })

    const fetchCustomers = useCallback(async () => {
        setLoading(true)
        try {
            const [res, metricsRes] = await Promise.all([
                adminCustomerApi.getCustomers({
                    page: currentPage,
                    limit: PAGE_SIZE,
                    search: search || undefined,
                    status: filter !== "Status" && filter !== "All" && filter !== "All Customers" ? filter : undefined
                }),
                adminCustomerApi.getCustomerMetrics()
            ])
            setCustomers(res.data.customers)
            setTotalPages(res.data.meta?.pageCount || Math.ceil((res.data.meta?.totalCount || res.data.customers.length) / PAGE_SIZE) || 1)
            if (metricsRes.data) {
                setMetrics(metricsRes.data)
            }
        } catch (error) {
            console.error("Failed to load admin customers:", error)
        } finally {
            setLoading(false)
        }
    }, [currentPage, search, filter])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchCustomers])

    useEffect(() => {
        setCurrentPage(1)
    }, [search, filter])

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-1">Customers</h1>
                <p className="text-gray-600 text-sm sm:text-base">View and manage customer accounts</p>
            </div>

            {/* Stat Cards — 2 columns */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard count={metrics.inactive} label="Inactive Customers" icon={<InactiveCustomersIcon />} />
                <StatCard count={metrics.active} label="Active Customers" icon={<ActiveCustomersIcon />} />
            </div>

            {/* Customers Table */}
            <Card>
                <CardContent className="p-5 sm:p-6">
                    {/* Search + Filter */}
                    <div className="mb-6">
                        <SearchFilterBar
                            search={search}
                            onSearchChange={setSearch}
                            filterValue={filter}
                            onFilterChange={setFilter}
                            searchPlaceholder="Search by name, email or customer ID"
                            filterOptions={FILTER_OPTIONS}
                        />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    {["Customer ID", "Customer Name", "Email Address", "Number of Shipments", "Status", "Action"].map((h) => (
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
                                {customers.map((c, i) => (
                                    <tr key={c.customerId || i} className="border-b border-gray-100 last:border-0">
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{c.customerId}</td>
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{c.customerName}</td>
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{c.emailAddress}</td>
                                        <td className="py-4 pr-6 text-gray-700 align-middle">{c.numberOfShipments}</td>
                                        <td className="py-4 pr-6 align-middle">
                                            <CustomerStatusBadge status={c.status as CustomerStatus} />
                                        </td>
                                        <td className="py-4 align-middle">
                                            <Link href={`/admin/customers/${c.customerId}`} className="text-[#2563EB] text-sm font-medium hover:underline whitespace-nowrap">
                                                View Details
                                            </Link>
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