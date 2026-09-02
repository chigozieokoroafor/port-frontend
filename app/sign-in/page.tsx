'use client'

import React, { useState } from "react"

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/context/auth-context'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [isLoading, setIsLoading] = useState(false)
    const [frontError, setFrontError] = useState<string | null>(null)
    const { login, error, user } = useAuth()
    const displayError = frontError || error
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
        if (frontError) setFrontError(null)
    }

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setFrontError(null)

        try {
            const res = await login({
                email: formData.email,
                password: formData.password,
            })
            
            const role = res?.data?.user?.role?.toLowerCase()
            
            if (role === 'customer') {
                router.push('/user/dashboard')
            } else if (role === 'admin' || role === 'super admin' || role === 'superadmin') {
                router.push('/admin/dashboard')
            } else {
                router.push('/user/dashboard')
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setFrontError(err.message)
            } else {
                setFrontError('Something went wrong. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-10 py-8">
            <div className="max-w-8xl w-full">

                <div className="overflow-hidden grid md:grid-cols-2 gap-10">
                    {/* Left Column - Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="px-4 sm:px-6 lg:px-12 flex flex-col justify-around">
                            <div className="mb-10">
                                {/* Logo Placeholder */}
                                <div className="w-24 h-10 bg-gray-300 mb-3" />

                                <h1 className="text-[42px] font-[300] text-[#111827] mb-3">Log in</h1>

                                {/* Social Login */}
                                <div className="flex flex-col lg:flex-row gap-3 mb-5">
                                    <Button variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent h-12">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
                                            <title>Google SVG Icon</title>
                                            <path fill="#fff" d="M44.59 4.21a63.28 63.28 0 0 0 4.33 120.9a67.6 67.6 0 0 0 32.36.35a57.13 57.13 0 0 0 25.9-13.46a57.44 57.44 0 0 0 16-26.26a74.3 74.3 0 0 0 1.61-33.58H65.27v24.69h34.47a29.72 29.72 0 0 1-12.66 19.52a36.2 36.2 0 0 1-13.93 5.5a41.3 41.3 0 0 1-15.1 0A37.2 37.2 0 0 1 44 95.74a39.3 39.3 0 0 1-14.5-19.42a38.3 38.3 0 0 1 0-24.63a39.25 39.25 0 0 1 9.18-14.91A37.17 37.17 0 0 1 76.13 27a34.3 34.3 0 0 1 13.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.2 61.2 0 0 0 87.2 4.59a64 64 0 0 0-42.61-.38" />
                                            <path fill="#e33629" d="M44.59 4.21a64 64 0 0 1 42.61.37a61.2 61.2 0 0 1 20.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.3 34.3 0 0 0-13.64-8a37.17 37.17 0 0 0-37.46 9.74a39.25 39.25 0 0 0-9.18 14.91L8.76 35.6A63.53 63.53 0 0 1 44.59 4.21" />
                                            <path fill="#f8bd00" d="M3.26 51.5a63 63 0 0 1 5.5-15.9l20.73 16.09a38.3 38.3 0 0 0 0 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 0 1-5.5-40.9" />
                                            <path fill="#587dbd" d="M65.27 52.15h59.52a74.3 74.3 0 0 1-1.61 33.58a57.44 57.44 0 0 1-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0 0 12.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68" />
                                            <path fill="#319f43" d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0 0 44 95.74a37.2 37.2 0 0 0 14.08 6.08a41.3 41.3 0 0 0 15.1 0a36.2 36.2 0 0 0 13.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 0 1-25.9 13.47a67.6 67.6 0 0 1-32.36-.35a63 63 0 0 1-23-11.59A63.7 63.7 0 0 1 8.75 92.4" />
                                        </svg>
                                        Log in with Google
                                    </Button>
                                    <Button variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent h-12">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
                                            <title>Apple-filled SVG Icon</title>
                                            <path fill="currentColor" d="M747.4 535.7c-.4-68.2 30.5-119.6 92.9-157.5c-34.9-50-87.7-77.5-157.3-82.8c-65.9-5.2-138 38.4-164.4 38.4c-27.9 0-91.7-36.6-141.9-36.6C273.1 298.8 163 379.8 163 544.6c0 48.7 8.9 99 26.7 150.8c23.8 68.2 109.6 235.3 199.1 232.6c46.8-1.1 79.9-33.2 140.8-33.2c59.1 0 89.7 33.2 141.9 33.2c90.3-1.3 167.9-153.2 190.5-221.6c-121.1-57.1-114.6-167.2-114.6-170.7m-105.1-305c50.7-60.2 46.1-115 44.6-134.7c-44.8 2.6-96.6 30.5-126.1 64.8c-32.5 36.8-51.6 82.3-47.5 133.6c48.4 3.7 92.6-21.2 129-63.7" />
                                        </svg>
                                        Log in with Apple
                                    </Button>
                                </div>

                                <div className="relative mb-6 text-center">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500">or</span>
                                    </div>
                                </div>

                                {/* Form */}
                                <div className="flex flex-col space-y-5">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email address
                                        </label>
                                        <Input id="email" name="email" type="email" placeholder="Enter your email address" value={formData.email} onChange={handleChange} className="border-gray-300 h-12]" />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <Input id="password" name="password" type="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} className="border-gray-300 h-12" />
                                        <div className="mt-2">
                                            <Link href={"/forgot-password"} className="text-primary text-sm underline">
                                                Forgot Password?
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {displayError && (
                                <div className="mb-4 rounded-md border border-red-300 bg-[#FDE8E8] p-3">
                                    <p className="text-sm text-red-600 font-medium">
                                        {displayError}
                                    </p>
                                </div>
                            )}
                            <div>
                                <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-dark text-white text-base font-semibold py-6">
                                    {isLoading ? 'Logging in...' : 'Log in'}
                                </Button>
                                <p className="text-sm text-gray-600 mt-3">
                                    Don't have an account?{' '}
                                    <Link href="/sign-up" className="text-primary font-semibold hover:underline">
                                        Sign up
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </form>

                    {/* Right Column - Image */}
                    <div className="hidden md:block relative h-[90vh] overflow-hidden">
                        <Image src="/images/auth-page.jpg" alt="Port-vessel" fill className="object-cover object-right" />
                    </div>
                </div>
            </div>
        </div>
    )
}
