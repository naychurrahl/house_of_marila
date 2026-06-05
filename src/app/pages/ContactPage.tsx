import { Mail, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="pt-14 min-h-screen">
      <div className="py-12 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl mb-3 tracking-tight">Contact Us</h1>
        <p className="text-neutral-600 mb-12">
          We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-xl mb-6 tracking-tight">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Subject</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Message</label>
                <textarea
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-neutral-300 text-sm resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black text-white py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors"
              >
                SEND MESSAGE
              </button>
              {submitted && (
                <p className="text-sm text-green-600 text-center">
                  Message sent successfully!
                </p>
              )}
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-xl mb-6 tracking-tight">Get in touch</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <Mail className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-sm mb-1">Email</h3>
                  <a href="mailto:info@atelier.com" className="text-sm text-neutral-600 hover:underline">
                    info@atelier.com
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <Phone className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-sm mb-1">Phone</h3>
                  <a href="tel:+12125550100" className="text-sm text-neutral-600 hover:underline">
                    +1 (212) 555-0100
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <MapPin className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-sm mb-1">Visit Us</h3>
                  <p className="text-sm text-neutral-600">
                    123 Greene Street<br />
                    New York, NY 10012
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-neutral-200">
              <h3 className="text-sm mb-4">Hours</h3>
              <div className="space-y-2 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <span>Monday - Saturday</span>
                  <span>11AM - 7PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>12PM - 6PM</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-neutral-200">
              <h3 className="text-sm mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a href="#" className="text-sm hover:underline">Instagram</a>
                <a href="#" className="text-sm hover:underline">Twitter</a>
                <a href="#" className="text-sm hover:underline">Pinterest</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
