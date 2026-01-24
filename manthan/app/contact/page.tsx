'use client'

import { useState, FormEvent } from 'react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Show success message
    setShowSuccess(true)
    
    // Clear form
    setName('')
    setEmail('')
    setMessage('')
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccess(false)
    }, 5000)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="mx-auto mt-6 max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto animate-fadeIn">
          {/* Page heading */}
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
            Contact Us
          </h1>
          
          {/* Explanatory copy */}
          <p className="text-gray-600 mb-8">
            Have questions about Manthan? Want to partner with us or report an issue? 
            We&apos;d love to hear from you! Fill out the form below and we&apos;ll get back to you soon.
          </p>

          {/* Success message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-slideUp">
              <p className="text-green-800 font-medium">
                ✓ Thank you for your message! We&apos;ll get back to you soon.
              </p>
            </div>
          )}

          {/* Contact form */}
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white p-8 animate-slideUp">
            {/* Name field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Your full name"
              />
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Message field */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                placeholder="Tell us what's on your mind..."
              />
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
