import Link from "next/link";

// Plain-language starting terms tailored to how this app actually
// works (residency-gated registration, PIN login, COD-only, no
// cancellation, next-day delivery window, direct settings-driven
// pricing). This is a reasonable starting point, not legal advice —
// worth a lawyer's review before relying on it for real disputes,
// especially around liability and data handling as the resident base
// grows.
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 text-sm leading-relaxed text-foreground">
      <Link href="/" className="text-sm text-muted-foreground underline">
        ← Back
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold">Terms of Service</h1>
      <p className="mt-1 text-xs text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <div className="mt-6 flex flex-col gap-5">
        <section>
          <h2 className="font-semibold">1. Who this service is for</h2>
          <p className="mt-1 text-muted-foreground">
            This app is available only to verified residents of Raheja Estate. Registration
            requires a real mobile number, a valid building, wing, and flat number within the
            community. Accounts found to misrepresent residency may be disabled without notice.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">2. Your account</h2>
          <p className="mt-1 text-muted-foreground">
            You&apos;re responsible for keeping your PIN confidential and for all activity under
            your account. If you suspect someone else has access to your account, contact us
            immediately so we can help secure it. We may suspend or disable an account that
            appears compromised, abusive, or in violation of these terms.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">3. Orders and pricing</h2>
          <p className="mt-1 text-muted-foreground">
            Prices, minimum order amounts, delivery charges, and product availability are set by
            the store and may change at any time without prior notice. Placing an order is an
            offer to buy at the price shown at checkout; we&apos;ll confirm what you&apos;ll
            actually be charged before you complete the order.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">4. Cancellations</h2>
          <p className="mt-1 text-muted-foreground">
            Once placed, an order cannot be cancelled or modified. Please review your cart
            carefully before confirming checkout.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">5. Delivery</h2>
          <p className="mt-1 text-muted-foreground">
            Orders are delivered the next day within the delivery window shown at checkout.
            Delivery times are estimates, not guarantees, and may occasionally shift due to
            weather, supply, or other circumstances outside our control.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">6. Payment</h2>
          <p className="mt-1 text-muted-foreground">
            Orders are currently Cash on Delivery only, unless another payment method is shown
            at checkout. Please have the exact amount ready for our delivery staff where
            possible.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">7. Product quality</h2>
          <p className="mt-1 text-muted-foreground">
            We aim to deliver fresh, good-quality produce. If something arrives damaged or not
            as described, let us know as soon as possible after delivery so we can make it
            right.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">8. Your information</h2>
          <p className="mt-1 text-muted-foreground">
            We collect your name, mobile number, building/wing/flat address, and order history
            to operate the service — process orders, arrange delivery, and provide support. We
            don&apos;t sell your personal information. Your PIN is stored in encrypted (hashed)
            form and isn&apos;t visible to anyone, including our staff.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">9. Changes to these terms</h2>
          <p className="mt-1 text-muted-foreground">
            We may update these terms from time to time as the service evolves. Continuing to
            use the app after a change means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">10. Contact</h2>
          <p className="mt-1 text-muted-foreground">
            Questions about these terms or your account? Reach out using the contact details
            shown on the catalogue page.
          </p>
        </section>
      </div>
    </main>
  );
}