'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, FileText } from "lucide-react"
import {
    StatCard,
    SearchFilterBar,
    DetailField,
    QuoteStatusBadge,
    adminTabTriggerClass,
    Pagination
} from "@/components/admin/comp"
import { useParams } from "next/navigation"
import { shipmentApi } from "@/lib/api/shipment"
import { quoteApi } from "@/lib/api/quotes"
import { paymentApi } from "@/lib/api/payment"
import { adminCustomerApi, GetCustomerProfileResponse } from "@/lib/api/customer"
import { Shipment, QuoteRequest, Payment } from "@/lib/types/constant"
import { useEffect, useCallback } from "react"
import { QuoteStatus } from "@/components/admin/type"
import { cn } from "@/lib/utils"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

type ShipmentStatus =
    | "In Transit"
    | "Delivered"
    | "Custom Clearance"
    | "Delayed"
    | "Port of Origin"
    | "Port of Destination"
    | "Pending"
    | "Failed"
    | "Loaded On Vessel"
    | "Vehicle Received"

type DocStatus = "Approved" | "Pending" | "Rejected"
type PaymentStatus = "Paid" | "Pending" | "Failed"

interface QuoteRow {
    id: string
    customerName: string
    vehicle: string
    route: string
    status: QuoteStatus
}

interface DocumentRow {
    name: string
    uploadedDate: string
    status: DocStatus
}

interface PaymentRow {
    shipmentId: string
    amount: string
    date: string
    status: PaymentStatus
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatVehicle(info?: Record<string, any>): string {
    if (!info) return "—"
    const { make, model, year } = info
    return [make, model, year].filter(Boolean).join(" ")
}

function formatRoute(info?: Record<string, any>): string {
    if (!info) return "—"
    const { originCountry, destinationCountry, originPort, destinationPort } = info
    if (originCountry && destinationCountry) {
        return `${originPort || originCountry} → ${destinationPort || destinationCountry}`
    }
    return "—"
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_SHIPMENTS: any[] = []
const MOCK_QUOTES: any[] = []
const MOCK_PAYMENTS: any[] = []

const MOCK_DOCUMENTS: DocumentRow[] = [
    { name: "Bill of Lading.pdf", uploadedDate: "Jan 28, 2026", status: "Approved" },
    { name: "Insurance Certificate.pdf", uploadedDate: "Jan 26, 2026", status: "Approved" },
    { name: "Insurance Certificate.pdf", uploadedDate: "Jan 26, 2026", status: "Approved" },
]

const SHIPMENT_FILTER_OPTIONS = ["All", "In Transit", "Delivered", "Custom Clearance", "Delayed", "Port of Origin"]
const QUOTE_FILTER_OPTIONS = ["All Quotes", "New Quotes", "Accepted Quotes", "Sent Quotes", "Quotes In Review"]
const PAYMENT_FILTER_OPTIONS = ["All", "Paid", "Pending", "Failed"]

// ── Stat Icons ────────────────────────────────────────────────────────────────

function TotalShipmentsIcon() {
    return (
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 22V12h6v10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    )
}

function TotalQuotesIcon() {
    return (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="3" width="14" height="18" rx="2" stroke="#6b7280" strokeWidth="1.5" />
                <path d="M8 8h8M8 12h8M8 16h5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </div>
    )
}

function TotalSpentIcon() {
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

// ── Shipment Status Badge ─────────────────────────────────────────────────────

function ShipmentStatusBadge({ status }: Readonly<{ status: ShipmentStatus }>) {
    const styles: Record<ShipmentStatus, string> = {
        "In Transit": "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        "Delivered": "bg-green-100 text-green-700 hover:bg-green-100",
        "Custom Clearance": "bg-purple-100 text-purple-700 hover:bg-purple-100",
        "Delayed": "bg-red-100 text-red-700 hover:bg-red-100",
        "Port of Origin": "bg-gray-100 text-gray-700 hover:bg-gray-100",
        "Port of Destination": "bg-orange-100 text-orange-700 hover:bg-orange-100",
    }
    return (
        <Badge className={cn("font-medium text-xs px-3 py-1 border-0", styles[status])}>
            {status}
        </Badge>
    )
}

// ── Document Status Badge ─────────────────────────────────────────────────────

function DocStatusBadge({ status }: Readonly<{ status: DocStatus }>) {
    const styles: Record<DocStatus, string> = {
        Approved: "bg-green-100 text-green-700 hover:bg-green-100",
        Pending: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        Rejected: "bg-red-100 text-red-700 hover:bg-red-100",
    }
    return (
        <Badge className={cn("font-medium text-xs px-3 py-1 border-0", styles[status])}>
            {status}
        </Badge>
    )
}

// ── Payment Status Badge ──────────────────────────────────────────────────────

function PaymentStatusBadge({ status }: Readonly<{ status: PaymentStatus }>) {
    const styles: Record<PaymentStatus, string> = {
        Paid: "bg-green-100 text-green-700 hover:bg-green-100",
        Pending: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        Failed: "bg-red-100 text-red-700 hover:bg-red-100",
    }
    return (
        <Badge className={cn("font-medium text-xs px-3 py-1 border-0", styles[status])}>
            {status}
        </Badge>
    )
}

// ── Tab: Profile Information ──────────────────────────────────────────────────

function ProfileInformationTab({ customerId }: Readonly<{ customerId: string }>) {
    const [profile, setProfile] = useState<GetCustomerProfileResponse["data"] | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let mounted = true
        setLoading(true)
        adminCustomerApi.getCustomerProfile(customerId)
            .then(res => {
                if (mounted && res.data) setProfile(res.data)
            })
            .catch(err => console.error(err))
            .finally(() => {
                if (mounted) setLoading(false)
            })
        return () => { mounted = false }
    }, [customerId])

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="py-8 text-center text-gray-500">Loading profile...</div>
                </CardContent>
            </Card>
        )
    }

    if (!profile) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="py-8 text-center text-gray-500">Profile not found.</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardContent className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                    <h2 className="text-base font-semibold text-[#111827]">Profile Information</h2>
                    <Badge className={cn(
                        "font-medium text-xs px-3 py-1 border-0",
                        profile.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                    )}>
                        {profile.status}
                    </Badge>
                </div>

                {/* Avatar */}
                <Avatar className="w-16 h-16">
                    {/* <AvatarImage src="/avatars/john.jpg" alt={profile.name} /> */}
                    <AvatarFallback className="bg-gray-200 text-gray-500 text-lg font-medium">
                        {profile.initials}
                    </AvatarFallback>
                </Avatar>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <DetailField label="Name" value={profile.name} />
                    <DetailField label="Email Address" value={profile.email} />
                    <DetailField label="Phone Number" value={profile.phoneNumber || "—"} />
                    <DetailField label="Company" value={profile.company || "—"} />
                    <DetailField label="Customer Since" value={new Date(profile.customerSince).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })} />
                </div>
            </CardContent>
        </Card>
    )
}

// ── Tab: Shipment History ─────────────────────────────────────────────────────

function ShipmentHistoryTab({ customerId }: Readonly<{ customerId: string }>) {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState("All")
    const [shipments, setShipments] = useState<Shipment[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchShipments = useCallback(async () => {
        setLoading(true)
        try {
            const res = await shipmentApi.getUserShipments(customerId, {
                page: currentPage,
                limit: 10,
                search: search || undefined,
                status: filter !== "Status" && filter !== "All" ? filter : undefined
            })
            setShipments(res.data)
            setTotalPages(res.meta?.pageCount || 1)
        } catch (error) {
            console.error("Failed to load user shipments:", error)
        } finally {
            setLoading(false)
        }
    }, [customerId, currentPage, search, filter])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchShipments()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchShipments])

    useEffect(() => {
        setCurrentPage(1)
    }, [search, filter])

    return (
        <Card>
            <CardContent className="p-5 sm:p-6">
                <div className="mb-6">
                    <SearchFilterBar
                        search={search}
                        onSearchChange={setSearch}
                        filterValue={filter}
                        onFilterChange={setFilter}
                        searchPlaceholder="Search by customer, vehicle or shipment ID"
                        filterOptions={SHIPMENT_FILTER_OPTIONS}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                {["Shipment ID", "Customer Name", "Vehicle", "Route", "Status", "Action"].map((h) => (
                                    <th key={h} className="text-left font-semibold text-[#111827] pb-3 pr-6 last:pr-0">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : shipments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">No shipments found.</td>
                                </tr>
                            ) : shipments.map((s) => (
                                <tr key={s.id} className="border-b border-gray-100 last:border-0">
                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-wrap">{s.shipmentId || s.id}</td>
                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-wrap">{s.customer || '—'}</td>
                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-wrap">{s.vehicle}</td>
                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-wrap">{s.route}</td>
                                    <td className="py-4 pr-6 align-top">
                                        <ShipmentStatusBadge status={s.status} />
                                    </td>
                                    <td className="py-4 align-top">
                                        <Link
                                            href={`/admin/shipments/${s.id}`}
                                            className="text-[#2563EB] text-sm font-medium hover:underline whitespace-nowrap"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && shipments.length > 0 && (
                    <Pagination current={currentPage} total={totalPages} onPageChange={setCurrentPage} />
                )}
            </CardContent>
        </Card>
    )
}

// ── Tab: Quote History ────────────────────────────────────────────────────────

function QuoteHistoryTab({ customerId }: Readonly<{ customerId: string }>) {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState("Status")
    const [quotes, setQuotes] = useState<QuoteRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchQuotes = useCallback(async () => {
        setLoading(true)
        try {
            const res = await quoteApi.getUserQuoteRequests(customerId, {
                page: currentPage,
                limit: 10,
            })
            setQuotes(res.data?.quoteRequests ?? [])
            setTotalPages(res.data?.meta?.pageCount || 1)
        } catch (error) {
            console.error("Failed to load user quotes:", error)
        } finally {
            setLoading(false)
        }
    }, [customerId, currentPage])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchQuotes()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchQuotes])

    useEffect(() => {
        setCurrentPage(1)
    }, [search, filter])

    // Client-side filtering if search is used, since API might not support it for this endpoint yet
    const filtered = quotes.filter(
        (q) =>
            !search ||
            q.referenceId?.toLowerCase().includes(search.toLowerCase()) ||
            q.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            q.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
            formatVehicle(q.vehicle).toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Card>
            <CardContent className="p-5 sm:p-6">
                <div className="mb-6">
                    <SearchFilterBar
                        search={search}
                        onSearchChange={setSearch}
                        filterValue={filter}
                        onFilterChange={setFilter}
                        searchPlaceholder="Search by customer, vehicle or quote ID"
                        filterOptions={QUOTE_FILTER_OPTIONS}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                {["Quote ID", "Customer Name", "Vehicle", "Route", "Status", "Action"].map((h) => (
                                    <th key={h} className="text-left font-semibold text-[#111827] pb-3 pr-6 last:pr-0">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">No quotes found.</td>
                                </tr>
                            ) : filtered.map((q) => (
                                <tr key={q.id || q._id} className="border-b border-gray-100 last:border-0">
                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-wrap">{q.referenceId}</td>
                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-wrap">{q.customer?.name || q.customer?.fullName || '—'}</td>
                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-wrap">{formatVehicle(q.vehicle)}</td>
                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-wrap">{formatRoute(q.route)}</td>
                                    <td className="py-4 pr-6 align-top">
                                        <QuoteStatusBadge status={q.status as QuoteStatus} />
                                    </td>
                                    <td className="py-4 align-top">
                                        <Link
                                            href={`/admin/quotes/${q.id || q._id}`}
                                            className="text-[#2563EB] text-sm font-medium hover:underline whitespace-nowrap"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && quotes.length > 0 && (
                    <Pagination current={currentPage} total={totalPages} onPageChange={setCurrentPage} />
                )}
            </CardContent>
        </Card>
    )
}

// ── Tab: Documents Uploaded ───────────────────────────────────────────────────

function DocumentsUploadedTab() {
    return (
        <Card>
            <CardContent className="p-6 space-y-4">
                <h2 className="text-base font-bold text-[#111827]">Documents</h2>

                <div className="space-y-1">
                    {MOCK_DOCUMENTS.map((doc, i) => (
                        <div
                            key={i + 1}
                            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#111827]">{doc.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Uploaded {doc.uploadedDate}</p>
                                </div>
                            </div>
                            <DocStatusBadge status={doc.status} />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// ── Tab: Payment History ──────────────────────────────────────────────────────

function PaymentHistoryTab({ customerId }: Readonly<{ customerId: string }>) {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState("Status")
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchPayments = useCallback(async () => {
        setLoading(true)
        try {
            const res = await paymentApi.getUserPaymentHistory(customerId, {
                page: currentPage,
                limit: 10,
            })
            setPayments(res.data)
            setTotalPages(res.meta?.pageCount || 1)
        } catch (error) {
            console.error("Failed to load user payments:", error)
        } finally {
            setLoading(false)
        }
    }, [customerId, currentPage])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPayments()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchPayments])

    useEffect(() => {
        setCurrentPage(1)
    }, [search, filter])

    // Client-side filtering since search/status might not be passed down to backend
    const filtered = payments.filter(
        (p) =>
            (!search || p.id.toLowerCase().includes(search.toLowerCase()) || p.paymentId?.toLowerCase().includes(search.toLowerCase())) &&
            (filter === "Status" || filter === "All" || p.status === filter.toLowerCase())
    )

    return (
        <Card>
            <CardContent className="p-5 sm:p-6">
                <div className="mb-6">
                    <SearchFilterBar
                        search={search}
                        onSearchChange={setSearch}
                        filterValue={filter}
                        onFilterChange={setFilter}
                        searchPlaceholder="Search by payment or shipment ID"
                        filterOptions={PAYMENT_FILTER_OPTIONS}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                {["Payment ID", "Amount", "Date", "Status", "Action"].map((h) => (
                                    <th key={h} className="text-left font-semibold text-[#111827] pb-3 pr-6 last:pr-0">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">No payments found.</td>
                                </tr>
                            ) : filtered.map((p) => (
                                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-wrap">{p.paymentId || p.id}</td>
                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-wrap">${p.amount}</td>
                                    <td className="py-4 pr-6 text-gray-700 align-top whitespace-pre-wrap">
                                        {new Date(p.createdAt).toLocaleDateString("en-GB")}
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        <PaymentStatusBadge status={p.status === "completed" ? "Paid" : p.status === "failed" ? "Failed" : "Pending"} />
                                    </td>
                                    <td className="py-4 align-top">
                                        {p.receiptUrl ? (
                                            <a
                                                href={p.receiptUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[#2563EB] text-sm font-medium hover:underline whitespace-nowrap"
                                            >
                                                View Receipt
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-sm">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && payments.length > 0 && (
                    <Pagination current={currentPage} total={totalPages} onPageChange={setCurrentPage} />
                )}
            </CardContent>
        </Card>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface AdminCustomerDetailPageProps {
    customerId?: string
    onBack?: () => void
    onContactCustomer?: () => void
    onViewShipmentDetails?: (id: string) => void
    onViewQuoteDetails?: (id: string) => void
    onViewPaymentDetails?: (id: string) => void
}

export default function AdminCustomerDetailPage({
    onBack,
    onContactCustomer,
    onViewShipmentDetails,
    onViewQuoteDetails,
    onViewPaymentDetails,
}: Readonly<AdminCustomerDetailPageProps>) {
    const params = useParams()
    const customerId = (params?.id as string) || "CUST-00124"
    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Link
                        href="/admin/customers"
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shrink-0 mt-0.5"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827]">Customer Details</h1>
                        <p className="text-gray-500 text-sm">{customerId}</p>
                    </div>
                </div>

                <Button
                    className="bg-[#2563EB] hover:bg-[#2563EB]/80 text-white shrink-0"
                    onClick={onContactCustomer}
                >
                    Contact Customer
                </Button>
            </div>

            {/* Stat Cards — 3 columns */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard count={25} label="Total Shipments" icon={<TotalShipmentsIcon />} />
                <StatCard count={25} label="Total Quotes" icon={<TotalQuotesIcon />} />
                <StatCard count={25} label="Total Spent" icon={<TotalSpentIcon />} />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="profile">
                <TabsList className="bg-transparent border-b border-gray-200 rounded-none w-full justify-start h-auto p-0 mb-6 overflow-x-auto">
                    <TabsTrigger value="profile" className={adminTabTriggerClass}>
                        Profile Information
                    </TabsTrigger>
                    <TabsTrigger value="shipments" className={adminTabTriggerClass}>
                        Shipment History
                    </TabsTrigger>
                    <TabsTrigger value="quotes" className={adminTabTriggerClass}>
                        Quote History
                    </TabsTrigger>
                    <TabsTrigger value="documents" className={adminTabTriggerClass}>
                        Document Uploaded
                    </TabsTrigger>
                    <TabsTrigger value="payments" className={adminTabTriggerClass}>
                        Payment History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <ProfileInformationTab customerId={customerId} />
                </TabsContent>

                <TabsContent value="shipments">
                    <ShipmentHistoryTab customerId={customerId} />
                </TabsContent>

                <TabsContent value="quotes">
                    <QuoteHistoryTab customerId={customerId} />
                </TabsContent>

                <TabsContent value="documents">
                    <DocumentsUploadedTab />
                </TabsContent>

                <TabsContent value="payments">
                    <PaymentHistoryTab customerId={customerId} />
                </TabsContent>
            </Tabs>
        </div>
    )
}