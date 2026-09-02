'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/context/auth-context'
import { CustomerInfo, VehicleInfo, RouteInfo } from '@/lib/types/constant'
import { quoteApi } from '@/lib/api/quotes'
import { StepIndicator } from '@/components/customer-dashboard/quotes/StepIndicator'
import { Step1CustomerInfo } from '@/components/customer-dashboard/quotes/form/Step1'
import { Step2VehicleInfo } from '@/components/customer-dashboard/quotes/form/Step2'
import { Step3RouteInfo } from '@/components/customer-dashboard/quotes/form/Step3'
import { Step4Review } from '@/components/customer-dashboard/quotes/form/Step4'
import { SuccessModal } from '@/components/customer-dashboard/quotes/SuccessModal'

export default function RequestQuotePage() {
    const router = useRouter()
    const { user } = useAuth()
    const [step, setStep] = useState(1)
    const [submitted, setSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [customer, setCustomer] = useState<CustomerInfo>({
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
    })

    const [vehicle, setVehicle] = useState<VehicleInfo>({
        vehicleType: '', vin: '', make: '', model: '',
        year: '', condition: '', length: '', width: '', height: '', weight: '',
    })

    const [route, setRoute] = useState<RouteInfo>({
        originCountry: 'United Kingdom',
        originPort: '',
        destinationCountry: '',
        destinationPort: '',
        shippingDate: undefined,
    })

    const handleNext = async () => {
        if (step < 4) {
            setStep(s => s + 1)
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            await quoteApi.createQuote({
                customer: {
                    fullName: `${customer.firstName} ${customer.lastName}`.trim(),
                    email: customer.email,
                    phone: customer.phone,
                },
                vehicle: {
                    type: vehicle.vehicleType,
                    vin: vehicle.vin,
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    condition: vehicle.condition as 'Running' | 'Non-running',
                    dimensions: {
                        length: Number.parseFloat(vehicle.length),
                        width: Number.parseFloat(vehicle.width),
                        height: Number.parseFloat(vehicle.height),
                    },
                    weight: Number.parseFloat(vehicle.weight),
                },
                route: {
                    originCountry: route.originCountry,
                    originPort: route.originPort,
                    destinationCountry: route.destinationCountry,
                    destinationPort: route.destinationPort,
                    shippingDate: route.shippingDate?.toISOString(),
                },
            })
            setSubmitted(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit quote. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleBack = () => { if (step > 1) setStep(s => s - 1) }

    let nextButtonLabel: string;

    if (isLoading) {
        nextButtonLabel = 'Submitting...';
    } else if (step === 4) {
        nextButtonLabel = 'Submit Quote Request';
    } else {
        nextButtonLabel = 'Next';
    }
    return (
        <div className="space-y-6 lg:space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-1">Request a Quote</h1>
                <p className="text-gray-600 text-sm sm:text-base">Fill in the details to get a shipping quote</p>
            </div>

            <StepIndicator currentStep={step} />

            {step === 1 && <Step1CustomerInfo data={customer} onChange={setCustomer} />}
            {step === 2 && <Step2VehicleInfo data={vehicle} onChange={setVehicle} />}
            {step === 3 && <Step3RouteInfo data={route} onChange={setRoute} />}
            {step === 4 && <Step4Review customer={customer} vehicle={vehicle} route={route} />}

            {error && (
                <p className="text-sm text-red-500 text-center max-w-4xl mx-auto">{error}</p>
            )}

            <div className="flex items-center justify-between max-w-4xl mx-auto pt-2">
                <Button variant="outline" className="w-44 border-[#2563EB] text-[#2563EB] hover:bg-[#DEE8FC]"
                    onClick={step === 1 ? () => router.back() : handleBack} disabled={isLoading}>
                    {step === 1 ? 'Cancel' : 'Back'}
                </Button>
                <Button className="w-44 bg-[#2563EB] hover:bg-[#2563EB]/80 text-white"
                    onClick={handleNext} disabled={isLoading}>
                    {nextButtonLabel}
                </Button>
            </div>

            <SuccessModal open={submitted} onClose={() => setSubmitted(false)} />
        </div>
    )
}