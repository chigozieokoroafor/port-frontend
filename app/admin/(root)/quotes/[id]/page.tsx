'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, FileText } from "lucide-react"
import { DetailField, adminTabTriggerClass, UpdateStatusDropdown, SpinnerInput } from "@/components/admin/comp"
import { QuoteDetail, QuoteStatus } from "@/components/admin/type"
import { useRouter, useParams } from "next/navigation"
import { adminQuoteApi } from "@/lib/api/quotes"
import { shipmentApi } from "@/lib/api/shipment"

interface AdminPricing {
    shippingCost: number
    insurance: number
    handlingFees: number
    customsDocumentation: number
    notes: string
}

const DEFAULT_PRICING: AdminPricing = {
    shippingCost: 0,
    insurance: 0,
    handlingFees: 0,
    customsDocumentation: 0,
    notes: "",
}


function CustomerTab({ detail, onNewQuote }: Readonly<{ detail: QuoteDetail; onNewQuote?: () => void }>) {
    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-start justify-between">
                        <h2 className="text-base font-bold text-[#111827]">Customer Information</h2>
                        <Button
                            variant="outline"
                            className="text-[#2563EB] border-blue-100 bg-[#DEE8FC] hover:bg-blue-100 text-sm h-8 px-3"
                            onClick={onNewQuote}
                        >
                            New Quote
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <DetailField label="Name" value={detail.customer.name} />
                        <DetailField label="Email Address" value={detail.customer.email} />
                        <DetailField label="Phone Number" value={detail.customer.phone} />
                        <DetailField label="Company" value={detail.customer.company} />
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-[#111827] mb-4">Vehicle Details</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <DetailField label="Type" value={detail.vehicle.type} />
                            <DetailField label="Make & Model" value={detail.vehicle.makeModel} />
                            <DetailField label="Year" value={detail.vehicle.year} />
                            <DetailField label="Condition" value={detail.vehicle.condition} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-[#111827] mb-4">Route Information</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <DetailField label="Origin" value={detail.route.origin} />
                            <DetailField label="Destination" value={detail.route.destination} />
                            <DetailField label="Shipping Method" value={detail.route.shippingMethod} />
                            <DetailField label="Estimated Transit Time" value={detail.route.transitTime} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 space-y-5">
                    <h2 className="text-base font-bold text-[#111827]">Quote Information</h2>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <DetailField label="Submitted" value={detail.quoteInfo.submitted} />
                        <DetailField label="Valid Until" value={detail.quoteInfo.validUntil} />
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-[#111827] mb-4">Attachments</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {detail.attachments.map((att, i) => (
                                <div key={i + 1} className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{att.name}</p>
                                        <p className="text-xs text-gray-400">{att.size}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function AdminTab({ pricing, onPricingChange, onSendQuote, onConvertToShipment, isSending, hasExistingQuote }: Readonly<{
    pricing: AdminPricing
    onPricingChange: (p: AdminPricing) => void
    onSendQuote?: () => void
    onConvertToShipment?: () => void
    isSending?: boolean
    hasExistingQuote?: boolean
}>) {
    const total =
        pricing.shippingCost +
        pricing.insurance +
        pricing.handlingFees +
        pricing.customsDocumentation

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-6 space-y-5">
                    <h2 className="text-base font-bold text-[#111827]">Admin Pricing</h2>

                    <SpinnerInput
                        label="Shipping Cost"
                        value={pricing.shippingCost}
                        onChange={v => onPricingChange({ ...pricing, shippingCost: v })}
                        disabled={hasExistingQuote}
                    />
                    <SpinnerInput
                        label="Insurance"
                        value={pricing.insurance}
                        onChange={v => onPricingChange({ ...pricing, insurance: v })}
                        disabled={hasExistingQuote}
                    />
                    <SpinnerInput
                        label="Handling Fees"
                        value={pricing.handlingFees}
                        onChange={v => onPricingChange({ ...pricing, handlingFees: v })}
                        disabled={hasExistingQuote}
                    />
                    <SpinnerInput
                        label="Customs & Documentation"
                        value={pricing.customsDocumentation}
                        onChange={v => onPricingChange({ ...pricing, customsDocumentation: v })}
                        disabled={hasExistingQuote}
                    />

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-sm font-semibold text-[#111827]">Total Cost</span>
                        <span className="text-lg font-bold text-[#111827]">
                            £ {total.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 space-y-3">
                    <h2 className="text-base font-bold text-[#111827]">Internal Notes</h2>
                    <Textarea
                        value={pricing.notes}
                        onChange={e => onPricingChange({ ...pricing, notes: e.target.value })}
                        placeholder="Add internal notes here..."
                        disabled={hasExistingQuote}
                        className="min-h-[120px] resize-none text-sm text-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                </CardContent>
            </Card>

            <div className="flex gap-4 pt-2">
                <Button
                    variant="outline"
                    className="flex-1 border-[#2563EB] text-[#2563EB] hover:bg-[#DEE8FC]"
                    onClick={onConvertToShipment}
                >
                    Convert to Shipment
                </Button>
                <Button
                    className="flex-1 bg-[#2563EB] hover:bg-[#2563EB]/80 text-white"
                    onClick={onSendQuote}
                    disabled={isSending || hasExistingQuote}
                >
                    {isSending ? "Sending..." : "Send Quote"}
                </Button>
            </div>
        </div>
    )
}

export default function AdminQuoteDetailPage() {
    const router = useRouter()
    const params = useParams()
    const quoteId = params.id as string

    const [detail, setDetail] = useState<QuoteDetail | null>(null)
    const [status, setStatus] = useState<QuoteStatus>("New")
    const [pricing, setPricing] = useState<AdminPricing>(DEFAULT_PRICING)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSending, setIsSending] = useState(false)
    const [isConverting, setIsConverting] = useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [hasExistingQuote, setHasExistingQuote] = useState(false)

    // ── Fetch quote ──────────────────────────────────────────────────────────

    const fetchQuote = useCallback(async (quoteId: string) => {
        setLoading(true)
        setError(null)
        try {
            const res = await adminQuoteApi.getQuoteRequestById(quoteId)
            const q = res.data
            console.log('quote', q)
            setDetail({
                id: q.id,
                referenceId: q.referenceId,
                customer: {
                    name: q.customer?.fullName ?? q.user?.firstName ? `${q.user.firstName} ${q.user.lastName}` : "—",
                    email: q.customer?.email ?? q.user?.email ?? "—",
                    phone: q.customer?.phone ?? "—",
                    company: q.customer?.companyName ?? "—",
                },
                vehicle: {
                    type: q.vehicle?.type ?? "—",
                    makeModel: `${q.vehicle?.make ?? ""} ${q.vehicle?.model ?? ""}`.trim() || "—",
                    year: q.vehicle?.year ?? "—",
                    condition: q.vehicle?.condition ?? "—",
                },
                route: {
                    origin: q.route?.originCountry ?? "—",
                    destination: q.route?.destinationCountry ?? "—",
                    shippingMethod: q.route?.shippingMethod ?? "—",
                    transitTime: q.route?.transitTime ?? "—",
                },
                quoteInfo: {
                    submitted: q.createdAt ? new Date(q.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—",
                    validUntil: q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—",
                },
                attachments: q.attachments ?? [],
            })

            setStatus(q.status ?? "New")
            if (q.quotes && q.quotes.pricing) {
                setHasExistingQuote(true)
                const customsCharge = q.quotes.pricing.additionalCharges?.find((c: any) => c.description === 'Customs & Documentation')?.amount || 0;
                setPricing({
                    shippingCost: q.quotes.pricing.shippingCost ?? 0,
                    insurance: q.quotes.pricing.insuranceCost ?? 0,
                    handlingFees: q.quotes.pricing.handlingFees ?? 0,
                    customsDocumentation: customsCharge,
                    notes: q.quotes.notes ?? q.notes ?? "",
                })
            } else {
                setHasExistingQuote(false)
                setPricing({
                    shippingCost: q.shippingCost ?? 0,
                    insurance: q.insurance ?? 0,
                    handlingFees: q.handlingFees ?? 0,
                    customsDocumentation: q.customsDocumentation ?? 0,
                    notes: q.notes ?? "",
                })
            }
        } catch (err) {
            console.error("Failed to fetch quote:", err)
            setError("Failed to load quote. Please try again.")

        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (quoteId) fetchQuote(quoteId)
    }, [quoteId, fetchQuote])

    // ── Status change ────────────────────────────────────────────────────────

    const handleStatusChange = async (newStatus: QuoteStatus) => {
        if (!quoteId || isUpdatingStatus) return
        setIsUpdatingStatus(true)
        try {
            if (newStatus === "Accepted") {
                await adminQuoteApi.approveQuoteRequest(quoteId)
            } else if (newStatus === "Rejected") {
                await adminQuoteApi.rejectQuoteRequest(quoteId)
            } else {
                await adminQuoteApi.updateQuote(quoteId, { status: newStatus })
            }
            setStatus(newStatus)
        } catch (err) {
            console.error("Failed to update status:", err)
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    // ── Send quote ───────────────────────────────────────────────────────────

    const handleSendQuote = async () => {
        if (!quoteId || isSending) return
        setIsSending(true)
        try {
            await adminQuoteApi.generateQuote(quoteId, {
                shippingCost: pricing.shippingCost,
                insurance: pricing.insurance,
                handlingFees: pricing.handlingFees,
                customsAndDocumentation: pricing.customsDocumentation,
                notes: pricing.notes,
            })
            
            setStatus("Sent")
            setHasExistingQuote(true)
            import('@/hooks/use-toast').then(({ toast }) => {
                toast({
                    title: "Success",
                    description: "Quote generated and sent successfully",
                })
            })
        } catch (err) {
            console.error("Failed to send quote:", err)
        } finally {
            setIsSending(false)
        }
    }

    // ── Convert to Shipment ──────────────────────────────────────────────────

    const handleConvertToShipment = async () => {
        if (!quoteId || isConverting) return
        setIsConverting(true)
        try {
            await shipmentApi.createShipment({ quoteRequestId: quoteId })
            import('@/hooks/use-toast').then(({ toast }) => {
                toast({
                    title: "Success",
                    description: "Shipment created successfully",
                })
            })
            router.push('/admin/shipments')
        } catch (err) {
            console.error("Failed to convert to shipment:", err)
        } finally {
            setIsConverting(false)
        }
    }


    if (loading) return <div className="p-8 text-sm text-gray-500">Loading quote...</div>
    if (error) return <div className="p-8 text-sm text-red-500 flex w-full items-center justify-center">
        <div className="flex items-center justify-center gap-4">
            <p>Failed to load quote.</p>
            <button
                onClick={() => fetchQuote(quoteId)}
                className="text-[#2563EB] text-sm font-medium hover:underline whitespace-nowrap"
            >
                Try Again
            </button>
        </div>
    </div>
    if (!detail) return null

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shrink-0 mt-0.5"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827]">
                            Quote Request #{detail.referenceId}
                        </h1>
                        <p className="text-gray-500 text-sm">Review and respond to quote request</p>
                    </div>
                </div>

                <UpdateStatusDropdown
                    value={status}
                    onChange={handleStatusChange}
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="customer">
                <TabsList className="bg-transparent border-b border-gray-200 rounded-none w-full justify-start h-auto p-0 mb-6">
                    <TabsTrigger value="customer" className={adminTabTriggerClass}>Customer</TabsTrigger>
                    <TabsTrigger value="admin" className={adminTabTriggerClass}>Admin</TabsTrigger>
                </TabsList>

                <TabsContent value="customer">
                    <CustomerTab detail={detail} />
                </TabsContent>

                <TabsContent value="admin">
                    <AdminTab
                        pricing={pricing}
                        onPricingChange={setPricing}
                        onSendQuote={handleSendQuote}
                        onConvertToShipment={handleConvertToShipment}
                        isSending={isSending}
                        hasExistingQuote={hasExistingQuote}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}