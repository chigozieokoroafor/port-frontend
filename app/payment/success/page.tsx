'use client'

import React, { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight } from "lucide-react"

function SuccessContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [mounted, setMounted] = useState(false)

    const quoteRef = searchParams.get('quoteRef')
    const sessionId = searchParams.get('session_id')

    useEffect(() => {
        setMounted(true)
        if (typeof window !== 'undefined') {
            const sid = new URLSearchParams(window.location.search).get('session_id')
            if (!sid) {
                router.replace('/')
            } else {
                const timer = setTimeout(() => {
                    router.push('/user/quotes')
                }, 5000)
                return () => clearTimeout(timer)
            }
        }
    }, [router])

    if (!mounted) return null

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center border border-gray-100">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                    Payment Successful!
                </h2>
                
                <p className="text-gray-500 mb-8 text-base leading-relaxed">
                    Thank you for your payment. Your transaction has been completed, and a receipt for your purchase has been emailed to you.
                    {quoteRef && (
                        <span className="block mt-2 font-medium text-gray-700">
                            Reference: {quoteRef}
                        </span>
                    )}
                </p>

                <div className="space-y-4">
                    <Button 
                        onClick={() => router.push('/user/dashboard')}
                        className="w-full bg-[#2563EB] hover:bg-[#2563EB]/90 text-white h-12 text-base font-semibold transition-all duration-200"
                    >
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    
                    <Button 
                        variant="outline"
                        onClick={() => router.push('/user/quotes')}
                        className="w-full h-12 text-base font-semibold text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                    >
                        View My Quotes
                    </Button>
                </div>
            </div>
            
            <div className="mt-8 text-center text-sm text-gray-400">
                <p>If you have any questions, please contact our support team.</p>
            </div>
        </div>
    )
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    )
}
