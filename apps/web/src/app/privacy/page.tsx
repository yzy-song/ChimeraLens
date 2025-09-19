import { ArrowLeft } from "lucide-react";
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="p-4 border-b bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          {/* 返回主页按钮 */}
          <Link href="/" className="flex items-center text-gray-600 hover:text-blue-500">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Link>
          <Link href="/" className="text-xl font-bold">
            ChimeraLens AI
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8 text-gray-800 dark:text-gray-200">
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-gray-500 dark:text-gray-400">Last updated: September 19, 2025</p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3">Welcome to ChimeraLens!</h2>
          <p>
            We are committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights in relation to it.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Guest Users:</strong> We store a randomly generated Guest ID to save your creation history. This is not linked to any personal information.
            </li>
            <li>
              <strong>Registered Users:</strong> When you register, we collect your name (optional) and email address. We do not store your password directly; we only store a secure hash of it.
            </li>
            <li>
              <strong>Uploaded & Generated Images:</strong> To provide the service, we temporarily process your uploaded photo (source image) and the template you select. The final generated image is stored so you can access it in your gallery.
            </li>
            <li>
              <strong>Payment Information:</strong> We do not process or store your credit card information. All payments are handled securely by our payment processor, Stripe.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To provide, maintain, and improve our face-swapping service.</li>
            <li>To associate your created images with your account (guest or registered) for you to view later.</li>
            <li>To process payments for credit packs.</li>
            <li>To communicate with you, for example, for password resets.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3">Third-Party Services</h2>
          <p>
            To make the magic happen, we share some data with trusted third-party services:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>
              <strong>Cloudinary:</strong> We use Cloudinary to store your uploaded and generated images.
            </li>
            <li>
              <strong>Replicate:</strong> We send the URLs of your source image and the template image to the Replicate API to perform the AI generation. As per their policy, this data is automatically deleted after a short period.
            </li>
            <li>
              <strong>Stripe:</strong> Handles all payment processing.
            </li>
          </ul>
          <p className="mt-2">
            We will never sell your personal data to any third party.
          </p>
        </section>
        
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3">Your Rights</h2>
          <p>
            You have the right to access and delete your data. You can view and manage your generated images in your gallery. If you wish to delete your account and all associated data, please contact us.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:privacy@chimeralens.com" className="text-blue-500 hover:underline">privacy@yourdomain.com</a>
          </p>
        </section>
      </main>
    </div>
  );
}