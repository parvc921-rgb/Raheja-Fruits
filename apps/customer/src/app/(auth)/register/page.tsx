"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { httpsCallable } from "firebase/functions";
import {
  pinSchema,
  phoneSchema,
  type RegisterCustomerResult,
} from "@raheja/shared";
import { functions } from "@/lib/firebase/client";
import { usePhoneOtp } from "@/hooks/use-phone-otp";
import { useBuildings } from "@/lib/buildings";
import { usePublicBusinessSettings } from "@/lib/business-settings";

type Step = "details" | "otp" | "address" | "pending";

const RECAPTCHA_CONTAINER_ID = "recaptcha-container";

// Direct registration — no invite code. Order of steps mirrors the
// order data has to become available: name + phone first (so we know
// who to send the OTP to), then OTP verification (which is also what
// signs the person in — Firestore Security Rules require a signed-in
// user to read `buildings`, so the address step has to come after
// this), then building/wing/flat + terms + a PIN for future logins.
export default function RegisterPage() {
  const router = useRouter();
  const { sendOtp, confirmOtp, sending, confirming, error: otpError } = usePhoneOtp();
  const { buildings, loading: buildingsLoading } = useBuildings();
  const { settings } = usePublicBusinessSettings();

  const [step, setStep] = useState<Step>("details");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91");
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [otpCode, setOtpCode] = useState("");

  const [buildingId, setBuildingId] = useState("");
  const [wing, setWing] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const selectedBuilding = buildings.find((b) => b.id === buildingId);

  // --- Step 1: name + phone, then send the OTP ---
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);

    if (name.trim().length < 2) {
      setDetailsError("Please enter your full name.");
      return;
    }
    const parsedPhone = phoneSchema.safeParse(phone);
    if (!parsedPhone.success) {
      setDetailsError(parsedPhone.error.issues[0]?.message ?? "Enter a valid mobile number.");
      return;
    }

    const sent = await sendOtp(phone, RECAPTCHA_CONTAINER_ID);
    if (sent) setStep("otp");
  };

  // --- Step 2: OTP confirmation (this is what signs the person in) ---
  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await confirmOtp(otpCode);
    if (ok) setStep("address");
  };

  // --- Step 3: address + terms + PIN, then complete registration ---
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);

    if (!buildingId) {
      setAddressError("Please select your building.");
      return;
    }
    if (!wing) {
      setAddressError("Please select your wing.");
      return;
    }
    if (!flatNumber.trim()) {
      setAddressError("Please enter your flat number.");
      return;
    }
    if (!acceptedTerms) {
      setAddressError("Please accept the Terms to continue.");
      return;
    }
    const parsedPin = pinSchema.safeParse(pin);
    if (!parsedPin.success) {
      setAddressError(parsedPin.error.issues[0]?.message ?? "Enter a valid PIN.");
      return;
    }
    if (pin !== pinConfirm) {
      setAddressError("PINs don't match.");
      return;
    }

    setCompleting(true);
    try {
      const registerCustomer = httpsCallable<
        { name: string; buildingId: string; wing: string; flatNumber: string; pin: string },
        RegisterCustomerResult
      >(functions, "registerCustomer");
      const { data } = await registerCustomer({
        name: name.trim(),
        buildingId,
        wing,
        flatNumber: flatNumber.trim(),
        pin,
      });

      if (!data.ok) {
        setAddressError(data.error ?? "Couldn't complete registration.");
        return;
      }

      if (data.pendingApproval) {
        setStep("pending");
        return;
      }

      router.push("/catalogue");
    } catch (err) {
      console.error("registerCustomer failed", err);
      setAddressError("Something went wrong. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  if (!settings.registrationEnabled) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-semibold">Registration is closed</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;re not accepting new registrations right now. Please check back later.
        </p>
        <Link href="/login" className="mt-2 text-sm font-medium text-primary underline">
          Already have an account? Log in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {step === "pending" ? "Almost there" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "details" && "Enter your name and mobile number to get started."}
          {step === "otp" && `We sent a code to ${phone}.`}
          {step === "address" && "Add your delivery address and set a PIN for future logins."}
          {step === "pending" &&
            "Your account has been created and is awaiting admin approval. We'll let you know once you're all set."}
        </p>
      </div>

      {step === "pending" && (
        <Link
          href="/login"
          className="rounded-md border border-border px-4 py-3 text-center text-sm font-medium hover:bg-muted"
        >
          Back to login
        </Link>
      )}

      {step === "details" && (
        <form onSubmit={handleSendCode} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium">
              Full name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-base"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-sm font-medium">
              Mobile number
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              className="rounded-md border border-border bg-background px-3 py-2 text-base"
            />
          </div>
          {(detailsError || otpError) && (
            <p className="text-sm text-red-600">{detailsError ?? otpError}</p>
          )}
          <button
            type="submit"
            disabled={sending}
            className="rounded-md bg-primary px-4 py-3 text-primary-foreground disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send verification code"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleConfirmOtp} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="otpCode" className="text-sm font-medium">
              Verification code
            </label>
            <input
              id="otpCode"
              inputMode="numeric"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="6-digit code"
              className="rounded-md border border-border bg-background px-3 py-2 text-base tracking-widest"
            />
          </div>
          {otpError && <p className="text-sm text-red-600">{otpError}</p>}
          <button
            type="submit"
            disabled={confirming}
            className="rounded-md bg-primary px-4 py-3 text-primary-foreground disabled:opacity-60"
          >
            {confirming ? "Verifying…" : "Verify code"}
          </button>
        </form>
      )}

      {step === "address" && (
        <form onSubmit={handleCompleteRegistration} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="buildingId" className="text-sm font-medium">
              Building
            </label>
            <select
              id="buildingId"
              value={buildingId}
              onChange={(e) => {
                setBuildingId(e.target.value);
                setWing(""); // reset wing when the building changes
              }}
              disabled={buildingsLoading}
              className="rounded-md border border-border bg-background px-3 py-2 text-base"
            >
              <option value="">{buildingsLoading ? "Loading…" : "Select building"}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="wing" className="text-sm font-medium">
              Wing
            </label>
            <select
              id="wing"
              value={wing}
              onChange={(e) => setWing(e.target.value)}
              disabled={!selectedBuilding}
              className="rounded-md border border-border bg-background px-3 py-2 text-base disabled:opacity-50"
            >
              <option value="">{selectedBuilding ? "Select wing" : "Pick a building first"}</option>
              {selectedBuilding?.wings.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="flatNumber" className="text-sm font-medium">
              Flat number
            </label>
            <input
              id="flatNumber"
              value={flatNumber}
              onChange={(e) => setFlatNumber(e.target.value)}
              placeholder="e.g. 1803"
              className="rounded-md border border-border bg-background px-3 py-2 text-base"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="pin" className="text-sm font-medium">
              Choose a PIN (4-6 digits)
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-base tracking-widest"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="pinConfirm" className="text-sm font-medium">
              Confirm PIN
            </label>
            <input
              id="pinConfirm"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-base tracking-widest"
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5"
            />
            I agree to Raheja Fruits'{" "}
            <Link href="/terms" target="_blank" className="underline">
              Terms of Service
            </Link>
            .
          </label>
          {addressError && <p className="text-sm text-red-600">{addressError}</p>}
          <button
            type="submit"
            disabled={completing}
            className="rounded-md bg-primary px-4 py-3 text-primary-foreground disabled:opacity-60"
          >
            {completing ? "Finishing up…" : "Finish registration"}
          </button>
        </form>
      )}

      {/* Firebase's invisible reCAPTCHA needs a mounted DOM node to bind to */}
      <div id={RECAPTCHA_CONTAINER_ID} />
    </main>
  );
}
